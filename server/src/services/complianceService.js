import prisma from '../config/prisma.js'
import { createError } from '../middlewares/errorHandler.js'
import { createAuditLog } from './auditService.js'
import { raiseException } from './exceptionService.js'

// ── Helpers ───────────────────────────────────

const generateSubmissionRef = () => {
  const ts     = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `RTI-${ts}-${random}`
}

const isValidTaxCode = (code) =>
  /^[0-9]{1,4}[LMNTY]$|^[BDFKSX][0-9]{1,4}[LMNTY]?$|^NT$|^BR$|^D[0-9]$/.test(code)

// ── Pre-flight compliance checks ──────────────

export const runComplianceChecks = async (payroll) => {
  const errors = []

  const contractor = await prisma.user.findUnique({
    where:  { id: payroll.contractorId },
    select: { id: true, firstName: true, lastName: true, isActive: true },
  })

  if (!contractor || !contractor.isActive) {
    errors.push({ code: 'CONTRACTOR_INACTIVE', message: 'Contractor account is inactive.' })
  }

  if (!isValidTaxCode(payroll.taxCode)) {
    errors.push({ code: 'INVALID_TAX_CODE', message: `Tax code "${payroll.taxCode}" is not valid.` })
  }

  if (!payroll.taxYear || !/^\d{4}\/\d{4}$/.test(payroll.taxYear)) {
    errors.push({ code: 'INVALID_TAX_YEAR', message: 'Tax year format must be YYYY/YYYY.' })
  }

  const grossPay = parseFloat(payroll.grossPay)
  if (grossPay < 0 || grossPay > 50000) {
    errors.push({ code: 'GROSS_PAY_OUT_OF_RANGE', message: `Gross pay £${grossPay} is outside the expected range.` })
  }

  const netPay = parseFloat(payroll.netPay)
  if (netPay < 0) {
    errors.push({ code: 'NET_PAY_NEGATIVE', message: 'Net pay cannot be negative.' })
  }

  if (netPay > grossPay) {
    errors.push({ code: 'NET_EXCEEDS_GROSS', message: 'Net pay cannot exceed gross pay.' })
  }

  return errors
}

// ── Submit RTI ────────────────────────────────

export const submitRti = async (payrollId, operatorId, operatorRole) => {
  const payroll = await prisma.payroll.findUnique({
    where:   { id: payrollId },
    include: {
      payslip:      true,
      rtiSubmission: true,
      invoice: {
        include: {
          contractorLink: {
            include: {
              contractor: { select: { id: true, firstName: true, lastName: true, email: true } },
              umbrella:   { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  })

  if (!payroll) throw createError('Payroll record not found.', 404)
  if (payroll.status !== 'PAYROLL_COMPLETED') {
    throw createError('RTI can only be submitted for completed payroll.', 409)
  }
  if (payroll.rtiSubmission) {
    throw createError('RTI has already been submitted for this payroll.', 409)
  }

  // Pre-flight compliance checks
  const errors = await runComplianceChecks(payroll)
  if (errors.length > 0) {
    await raiseException({
      type:           'INVALID_TAX_CODE',
      referenceId:    payrollId,
      referenceType:  'PAYROLL',
      organisationId: payroll.umbrellaId,
      description:    `Compliance pre-flight failed: ${errors.map((e) => e.message).join('; ')}`,
    })
    throw createError(`Compliance checks failed: ${errors.map((e) => e.message).join(', ')}`, 422)
  }

  const { contractor } = payroll.invoice.contractorLink
  const submissionRef  = generateSubmissionRef()

  const payload = {
    submissionType: 'FPS',
    taxYear:        payroll.taxYear,
    paymentDate:    payroll.disbursedAt,
    employee: {
      firstName: contractor.firstName,
      lastName:  contractor.lastName,
      taxCode:   payroll.taxCode,
    },
    payment: {
      grossPay:            payroll.grossPay,
      incomeTax:           payroll.incomeTax,
      employeeNI:          payroll.employeeNI,
      employerNI:          payroll.employerNI,
      netPay:              payroll.netPay,
      pensionContribution: payroll.pensionContribution,
      payPeriodStart:      payroll.payPeriodStart,
      payPeriodEnd:        payroll.payPeriodEnd,
    },
    generatedAt: new Date().toISOString(),
  }

  // Create RTI submission record
  const submission = await prisma.rtiSubmission.create({
    data: {
      payrollId,
      umbrellaId:    payroll.umbrellaId,
      submissionRef,
      taxYear:       payroll.taxYear,
      periodStart:   payroll.payPeriodStart,
      periodEnd:     payroll.payPeriodEnd,
      status:        'SUBMITTED',
      payload,
      submittedAt:   new Date(),
    },
  })

  // In production: fire HMRC API here
  // For now: auto-accept immediately
  const accepted = await prisma.rtiSubmission.update({
    where: { id: submission.id },
    data:  { status: 'ACCEPTED', acceptedAt: new Date() },
  })

  await createAuditLog({
    actorId:     operatorId,
    actorRole:   operatorRole,
    eventType:   'COMPLIANCE_SUBMITTED',
    beforeState: 'PAYROLL_COMPLETED',
    afterState:  'COMPLIANCE_SUBMITTED',
    metadata:    { payrollId, submissionRef, rtiSubmissionId: submission.id },
  })

  return accepted
}

// ── Get RTI submission ─────────────────────────

export const getRtiSubmission = async (rtiId, requestingUser) => {
  const rti = await prisma.rtiSubmission.findUnique({
    where:   { id: rtiId },
    include: { payroll: true },
  })
  if (!rti) throw createError('RTI submission not found.', 404)

  const userOrgIds      = requestingUser.memberships.map((m) => m.organisationId)
  const isPlatformAdmin = requestingUser.memberships.some((m) => m.role === 'PLATFORM_ADMIN')
  if (!isPlatformAdmin && !userOrgIds.includes(rti.umbrellaId)) {
    throw createError('Access denied.', 403)
  }

  return rti
}

// ── Validate invoice pre-payroll ──────────────

export const validateInvoice = async (invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where:   { id: invoiceId },
    include: {
      contractorLink: true,
      payroll:        true,
    },
  })

  if (!invoice) throw createError('Invoice not found.', 404)

  const checks = {
    invoiceStatus:   invoice.status,
    payrollReady:    invoice.status === 'PAYMENT_RECEIVED',
    payrollExists:   !!invoice.payroll,
    grossAmount:     invoice.grossAmount,
  }

  return checks
}

// ── Aliases matching the controller imports ───

export const validatePrePayroll    = validateInvoice
export const submitToHMRC          = submitRti
export const retrySubmission       = async (submissionId, operatorId, operatorRole) => {
  const existing = await prisma.rtiSubmission.findUnique({ where: { id: submissionId } })
  if (!existing) throw createError('RTI submission not found.', 404)
  if (existing.status === 'ACCEPTED') throw createError('Submission already accepted.', 409)

  const updated = await prisma.rtiSubmission.update({
    where: { id: submissionId },
    data: {
      status:      'SUBMITTED',
      submittedAt: new Date(),
      retryCount:  { increment: 1 },
      failureReason: null,
    },
  })

  // Auto-accept in dev
  const accepted = await prisma.rtiSubmission.update({
    where: { id: submissionId },
    data:  { status: 'ACCEPTED', acceptedAt: new Date() },
  })

  await createAuditLog({
    actorId:   operatorId,
    actorRole: operatorRole,
    eventType: 'RTI_SUBMISSION_RETRIED',
    metadata:  { submissionId },
  })

  return accepted
}

export const getSubmissionByPayroll = async (payrollId, requestingUser) => {
  const rti = await prisma.rtiSubmission.findUnique({
    where:   { payrollId },
    include: { payroll: true },
  })
  if (!rti) throw createError('No RTI submission found for this payroll.', 404)

  const userOrgIds      = requestingUser.memberships.map((m) => m.organisationId)
  const isPlatformAdmin = requestingUser.memberships.some((m) => m.role === 'PLATFORM_ADMIN')
  if (!isPlatformAdmin && !userOrgIds.includes(rti.umbrellaId)) {
    throw createError('Access denied.', 403)
  }

  return rti
}