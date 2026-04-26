import prisma from '../config/prisma.js'
import { createError } from '../middlewares/errorHandler.js'
import { createAuditLog } from './auditService.js'

// ── Tax constants (UK 2024/25) ────────────────

const TAX_CONFIG = {
  personalAllowance:      12570,
  basicRateThreshold:     50270,
  higherRateThreshold:    125140,
  basicRate:              0.20,
  higherRate:             0.40,
  additionalRate:         0.45,
  employeeNI_threshold:   12570,
  employeeNI_upperLimit:  50270,
  employeeNI_rate:        0.08,
  employeeNI_upperRate:   0.02,
  employerNI_threshold:   9100,
  employerNI_rate:        0.138,
  umbrellaFeeDefault:     30.00,
  pensionRate:            0.05,
}

// ── Gross-to-net calculation ──────────────────

const calculateGrossToNet = ({
  grossPay,
  taxCode           = '1257L',
  annualisedGross   = null,
  hasPension        = false,
  hasStudentLoan    = false,
  studentLoanPlan   = 1,
  umbrellaFee       = TAX_CONFIG.umbrellaFeeDefault,
}) => {
  const gross = parseFloat(grossPay)

  // Annualise for tax band calculation (assume weekly pay * 52 if not provided)
  const annualised = annualisedGross ?? gross * 52

  // ── Income Tax (PAYE) ─────────────────────
  const taxableAnnual = Math.max(0, annualised - TAX_CONFIG.personalAllowance)
  let annualTax = 0
  if (taxableAnnual > 0) {
    const basicBand  = Math.min(taxableAnnual, TAX_CONFIG.basicRateThreshold  - TAX_CONFIG.personalAllowance)
    const higherBand = Math.min(Math.max(0, taxableAnnual - (TAX_CONFIG.basicRateThreshold - TAX_CONFIG.personalAllowance)),
                                TAX_CONFIG.higherRateThreshold - TAX_CONFIG.basicRateThreshold)
    const addlBand   = Math.max(0, taxableAnnual - (TAX_CONFIG.higherRateThreshold - TAX_CONFIG.personalAllowance))

    annualTax = (basicBand  * TAX_CONFIG.basicRate)
              + (higherBand * TAX_CONFIG.higherRate)
              + (addlBand   * TAX_CONFIG.additionalRate)
  }
  const incomeTax = parseFloat(((annualTax / 52) * (gross / (annualised / 52))).toFixed(2))

  // ── Employee NI ───────────────────────────
  const annualEmployeeNI_main  = Math.min(
    Math.max(0, annualised - TAX_CONFIG.employeeNI_threshold),
    TAX_CONFIG.employeeNI_upperLimit - TAX_CONFIG.employeeNI_threshold,
  ) * TAX_CONFIG.employeeNI_rate

  const annualEmployeeNI_upper = Math.max(0, annualised - TAX_CONFIG.employeeNI_upperLimit)
    * TAX_CONFIG.employeeNI_upperRate

  const employeeNI = parseFloat(((annualEmployeeNI_main + annualEmployeeNI_upper) / 52).toFixed(2))

  // ── Employer NI ───────────────────────────
  const annualEmployerNI = Math.max(0, annualised - TAX_CONFIG.employerNI_threshold)
    * TAX_CONFIG.employerNI_rate
  const employerNI = parseFloat((annualEmployerNI / 52).toFixed(2))

  // ── Pension ───────────────────────────────
  const pensionContribution = hasPension
    ? parseFloat((gross * TAX_CONFIG.pensionRate).toFixed(2))
    : 0

  // ── Student Loan ──────────────────────────
  let studentLoanRepayment = 0
  if (hasStudentLoan) {
    const thresholds = { 1: 24990, 2: 27295, 4: 31395, 5: 25000 }
    const rates      = { 1: 0.09,  2: 0.09,  4: 0.09,  5: 0.09  }
    const threshold  = (thresholds[studentLoanPlan] ?? 24990) / 52
    const rate       = rates[studentLoanPlan] ?? 0.09
    studentLoanRepayment = gross > threshold
      ? parseFloat(((gross - threshold) * rate).toFixed(2))
      : 0
  }

  // ── Net Pay ───────────────────────────────
  const totalDeductions = incomeTax + employeeNI + umbrellaFee + pensionContribution + studentLoanRepayment
  const netPay          = parseFloat(Math.max(0, gross - totalDeductions).toFixed(2))

  return {
    grossPay:            parseFloat(gross.toFixed(2)),
    incomeTax,
    employeeNI,
    employerNI,
    umbrellaFee:         parseFloat(umbrellaFee.toFixed(2)),
    pensionContribution,
    studentLoanRepayment,
    netPay,
    taxCode,
  }
}

// ── Helpers ───────────────────────────────────

const getTaxYear = () => {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1
  const day   = now.getDate()
  const isAfterTaxYearStart = month > 4 || (month === 4 && day >= 6)
  return isAfterTaxYearStart ? `${year}/${year + 1}` : `${year - 1}/${year}`
}

const generatePayslipNumber = () => {
  const ts     = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `PAY-${ts}-${random}`
}

// ── Run payroll ───────────────────────────────

export const runPayroll = async (invoiceId, operatorId, operatorRole, options = {}) => {
  // Hard guard — must be PAYMENT_RECEIVED before payroll can run
  const invoice = await prisma.invoice.findUnique({
    where:   { id: invoiceId },
    include: {
      timesheet: {
        include: {
          versions:      { orderBy: { version: 'desc' }, take: 1 },
          contractorLink: true,
        },
      },
      payroll: true,
    },
  })

  if (!invoice) throw createError('Invoice not found.', 404)

  if (invoice.status !== 'PAYMENT_RECEIVED') {
    await createAuditLog({
      actorId:   operatorId,
      actorRole: operatorRole,
      eventType: 'PAYROLL_REJECTED_PAYMENT_NOT_RECEIVED',
      metadata:  { invoiceId, actualStatus: invoice.status },
    })
    throw createError(
      `Payroll cannot run. Invoice status is "${invoice.status}". Payment must be received and reconciled first.`,
      409,
    )
  }

  if (invoice.payroll) {
    throw createError('Payroll has already been run for this invoice.', 409)
  }

  const { timesheet }      = invoice
  const { contractorLink } = timesheet
  const latestVersion      = timesheet.versions[0]

  const calculation = calculateGrossToNet({
    grossPay:         parseFloat(invoice.grossAmount),
    taxCode:          options.taxCode          ?? '1257L',
    hasPension:       options.hasPension       ?? false,
    hasStudentLoan:   options.hasStudentLoan   ?? false,
    studentLoanPlan:  options.studentLoanPlan  ?? 1,
    umbrellaFee:      options.umbrellaFee      ?? TAX_CONFIG.umbrellaFeeDefault,
  })

  // Create payroll record in PROCESSING state
  const payroll = await prisma.payroll.create({
    data: {
      invoiceId,
      contractorId: contractorLink.contractorId,
      umbrellaId:   contractorLink.umbrellaId,
      taxYear:      getTaxYear(),
      payPeriodStart: timesheet.periodStart,
      payPeriodEnd:   timesheet.periodEnd,
      status:         'PAYROLL_PROCESSING',
      ...calculation,
    },
  })

  await createAuditLog({
    actorId:     operatorId,
    actorRole:   operatorRole,
    eventType:   'PAYROLL_PROCESSING_STARTED',
    beforeState: 'PAYMENT_RECEIVED',
    afterState:  'PAYROLL_PROCESSING',
    metadata:    { payrollId: payroll.id, invoiceId, grossPay: calculation.grossPay },
  })

  // Generate payslip
  const payslip = await prisma.payslip.create({
    data: {
      payrollId:    payroll.id,
      contractorId: contractorLink.contractorId,
      payslipNumber: generatePayslipNumber(),
      periodStart:   timesheet.periodStart,
      periodEnd:     timesheet.periodEnd,
      paymentDate:   new Date(),
      taxYear:       getTaxYear(),
      currency:      invoice.currency,
      ...calculation,
    },
  })

  // Mark payroll complete and stamp disbursedAt
  const completedPayroll = await prisma.payroll.update({
    where: { id: payroll.id },
    data:  { status: 'PAYROLL_COMPLETED', disbursedAt: new Date() },
    include: { payslip: true },
  })

  await createAuditLog({
    actorId:     operatorId,
    actorRole:   operatorRole,
    eventType:   'PAYROLL_COMPLETED',
    beforeState: 'PAYROLL_PROCESSING',
    afterState:  'PAYROLL_COMPLETED',
    metadata:    {
      payrollId:    completedPayroll.id,
      payslipId:    payslip.id,
      netPay:       calculation.netPay,
      contractorId: contractorLink.contractorId,
    },
  })

  return { payroll: completedPayroll, payslip }
}

// ── Queries ───────────────────────────────────

export const getPayrollById = async (payrollId, requestingUser) => {
  const payroll = await prisma.payroll.findUnique({
    where:   { id: payrollId },
    include: {
      payslip: true,
      invoice: {
        include: {
          contractorLink: {
            include: {
              contractor: { select: { id: true, firstName: true, lastName: true } },
              agency:     { select: { id: true, name: true } },
              umbrella:   { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  })
  if (!payroll) throw createError('Payroll record not found.', 404)

  const userOrgIds      = requestingUser.memberships.map((m) => m.organisationId)
  const isPlatformAdmin = requestingUser.memberships.some((m) => m.role === 'PLATFORM_ADMIN')
  const isContractor    = payroll.contractorId === requestingUser.id
  const isOrgMember     = userOrgIds.includes(payroll.umbrellaId)

  if (!isPlatformAdmin && !isContractor && !isOrgMember) {
    throw createError('Access denied.', 403)
  }

  return payroll
}

export const getPayslipById = async (payslipId, requestingUser) => {
  const payslip = await prisma.payslip.findUnique({
    where:   { id: payslipId },
    include: { payroll: true },
  })
  if (!payslip) throw createError('Payslip not found.', 404)

  const isPlatformAdmin = requestingUser.memberships.some((m) => m.role === 'PLATFORM_ADMIN')
  const isOwner         = payslip.contractorId === requestingUser.id
  const userOrgIds      = requestingUser.memberships.map((m) => m.organisationId)
  const isUmbrellaMember = userOrgIds.includes(payslip.payroll.umbrellaId)

  if (!isPlatformAdmin && !isOwner && !isUmbrellaMember) {
    throw createError('Access denied.', 403)
  }

  return payslip
}

export const getMyPayslips = async (contractorId) => {
  return prisma.payslip.findMany({
    where:   { contractorId },
    include: { payroll: { select: { status: true, disbursedAt: true, taxYear: true } } },
    orderBy: { generatedAt: 'desc' },
  })
}