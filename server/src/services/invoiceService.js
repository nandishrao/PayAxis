import prisma from '../config/prisma.js'
import { createError } from '../middlewares/errorHandler.js'
import { createAuditLog } from './auditService.js'
import { generateInvoiceNumber } from '../utils/invoiceNumber.js'

// ─────────────────────────────────────────────
// AUTO-GENERATION
// Triggered immediately when a timesheet reaches WORK_APPROVED.
// Called internally from the timesheet approval flow.
// ─────────────────────────────────────────────

export const autoGenerateInvoice = async (timesheetId) => {
  const timesheet = await prisma.timesheet.findUnique({
    where:   { id: timesheetId },
    include: {
      versions:       { orderBy: { version: 'desc' }, take: 1 },
      contractorLink: true,
    },
  })

  if (!timesheet) throw createError('Timesheet not found.', 404)
  if (timesheet.status !== 'WORK_APPROVED') {
    throw createError('Invoice can only be generated for approved timesheets.', 409)
  }

  const existing = await prisma.invoice.findUnique({ where: { timesheetId } })
  if (existing) return existing

  const latestVersion = timesheet.versions[0]
  const totalHours    = parseFloat(latestVersion.totalHours)
  const ratePerHour   = parseFloat(timesheet.contractorLink.agreedRatePerHour)
  const grossAmount   = (totalHours * ratePerHour).toFixed(2)
  const dueDate       = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  let invoice
  let attempts = 0
  while (!invoice && attempts < 5) {
    try {
      invoice = await prisma.invoice.create({
        data: {
          timesheetId,
          invoiceNumber:    generateInvoiceNumber(),
          contractorLinkId: timesheet.contractorLinkId,
          agencyId:         timesheet.contractorLink.agencyId,
          umbrellaId:       timesheet.contractorLink.umbrellaId,
          grossAmount,
          currency:         timesheet.contractorLink.currency,
          dueDate,
          status:           'INVOICE_GENERATED',
        },
      })
    } catch (err) {
      if (err.code === 'P2002') { attempts++; continue }
      throw err
    }
  }
  if (!invoice) throw createError('Failed to generate a unique invoice number.', 500)

  await createAuditLog({
    eventType:  'INVOICE_GENERATED',
    afterState: 'INVOICE_GENERATED',
    metadata:   { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, timesheetId, grossAmount },
  })

  return invoice
}

// ─────────────────────────────────────────────
// AGENCY APPROVAL
// Once approved, the invoice is immutable (isLocked = true).
// ─────────────────────────────────────────────
export const approveInvoice = async (invoiceId, agencyUserId, agencyRole) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice) throw createError('Invoice not found.', 404)
  if (invoice.isLocked) throw createError('This invoice is locked and cannot be modified.', 409)
  if (invoice.status !== 'INVOICE_GENERATED') {
    throw createError(`Cannot approve invoice with status: ${invoice.status}.`, 409)
  }
 
  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data:  {
      status:       'INVOICE_APPROVED',
      isLocked:     true,
      lockedAt:     new Date(),
      approvedAt:   new Date(),
      approvedById: agencyUserId,
    },
  })
 
  await createAuditLog({
    actorId:     agencyUserId,
    actorRole:   agencyRole,
    eventType:   'INVOICE_APPROVED',
    beforeState: 'INVOICE_GENERATED',
    afterState:  'INVOICE_APPROVED',
    metadata:    { invoiceId, invoiceNumber: invoice.invoiceNumber },
  })
 
  return updated
}

// ─────────────────────────────────────────────
// PAYMENT WEBHOOK / RECONCILIATION
// Called when a bank transfer notification arrives.
// Matches the payment reference to an open invoice,
// verifies the amount, and marks PAYMENT_RECEIVED if clean.
// ─────────────────────────────────────────────

export const handleIncomingPayment = async ({
  paymentReference,
  amountReceived,
  currency = 'GBP',
  bankSource,
  rawWebhookPayload,
}) => {
  // Payment reference must match the invoice number
  // Invoice must be INVOICE_APPROVED to receive payment
  const invoice = await prisma.invoice.findFirst({
    where: {
      invoiceNumber: paymentReference,
      status: { in: ['INVOICE_APPROVED', 'PAYMENT_PENDING'] },
    },
  })
 
  if (!invoice) {
    // Unrecognised payment — raise exception
    await prisma.exception.create({
      data: {
        type:          'UNRECOGNISED_PAYMENT',
        status:        'OPEN',
        referenceId:   paymentReference,
        referenceType: 'PAYMENT',
        description:   `No open invoice found for payment reference: ${paymentReference}`,
      },
    })
    return { matched: false, reason: 'No matching invoice found. Exception raised.' }
  }
 
  const amountExpected = parseFloat(invoice.grossAmount)
  const received       = parseFloat(amountReceived)
  const isMismatch     = Math.abs(received - amountExpected) > 0.01
 
  // Record the payment
  const payment = await prisma.payment.create({
    data: {
      invoiceId:        invoice.id,
      paymentReference,
      amount:           received,
      currency,
      senderAccountRef: bankSource,
      matchStatus:      isMismatch ? 'MISMATCHED' : 'MATCHED',
      matchedAt:        isMismatch ? null : new Date(),
      rawWebhookPayload: rawWebhookPayload ?? null,
    },
  })
 
  if (isMismatch) {
    await prisma.exception.create({
      data: {
        type:          'PAYMENT_MISMATCH',
        status:        'OPEN',
        referenceId:   invoice.id,
        referenceType: 'INVOICE',
        description:   `Payment mismatch. Expected: £${amountExpected}, Received: £${received}.`,
      },
    })
 
    await createAuditLog({
      eventType:   'PAYMENT_MISMATCH',
      beforeState: 'PAYMENT_PENDING',
      metadata:    { invoiceId: invoice.id, paymentReference, amountExpected, received },
    })
 
    return { matched: true, reconciled: false, mismatch: true, payment }
  }
 
  // Clean match — reconcile and unlock payroll
  const [, updatedInvoice] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data:  { matchStatus: 'MATCHED', matchedAt: new Date() },
    }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data:  { status: 'PAYMENT_RECEIVED', paidAt: new Date() },
    }),
  ])
 
  await createAuditLog({
    eventType:   'PAYMENT_RECEIVED',
    beforeState: 'PAYMENT_PENDING',
    afterState:  'PAYMENT_RECEIVED',
    metadata:    { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, paymentReference, received },
  })
 
  return { matched: true, reconciled: true, payment, invoice: updatedInvoice }
}


export const markPaymentPending = async (invoiceId, agencyUserId, agencyRole) => {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
  if (!invoice) throw createError('Invoice not found.', 404)
  if (invoice.status !== 'INVOICE_APPROVED') {
    throw createError(`Invoice must be INVOICE_APPROVED before marking payment pending. Current status: ${invoice.status}.`, 409)
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data:  { status: 'PAYMENT_PENDING' },
  })

  await createAuditLog({
    actorId:     agencyUserId,
    actorRole:   agencyRole,
    eventType:   'PAYMENT_PENDING',
    beforeState: 'INVOICE_APPROVED',
    afterState:  'PAYMENT_PENDING',
    metadata:    { invoiceId },
  })

  return updated
}

// ─────────────────────────────────────────────
// EXCEPTION MANAGEMENT
// ─────────────────────────────────────────────

export const createPaymentException = async ({ invoiceId, paymentId, reason, metadata }) => {
  const exception = await prisma.paymentException.create({
    data: { invoiceId, paymentId, reason, status: 'OPEN' },
  })

  await createAuditLog({
    eventType: 'PAYMENT_EXCEPTION_RAISED',
    metadata:  { exceptionId: exception.id, reason, ...metadata },
  })

  return exception
}

export const resolvePaymentException = async (
  exceptionId,
  { resolutionNote },
  resolvedById,
  resolvedByRole,
) => {
  if (!resolutionNote?.trim()) {
    throw createError('A resolution note is required to resolve an exception.', 422)
  }

  const exception = await prisma.paymentException.findUnique({ where: { id: exceptionId } })
  if (!exception) throw createError('Exception not found.', 404)
  if (exception.status === 'RESOLVED') throw createError('Exception is already resolved.', 409)

  const resolved = await prisma.paymentException.update({
    where: { id: exceptionId },
    data:  {
      status:         'RESOLVED',
      resolvedById,
      resolvedAt:     new Date(),
      resolutionNote,
    },
  })

  await createAuditLog({
    actorId:   resolvedById,
    actorRole: resolvedByRole,
    eventType: 'PAYMENT_EXCEPTION_RESOLVED',
    metadata:  { exceptionId, resolutionNote },
  })

  return resolved
}

// ─────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────

export const getInvoiceById = async (invoiceId) => {
  const invoice = await prisma.invoice.findUnique({
    where:   { id: invoiceId },
    include: {
      timesheet: { include: { versions: { orderBy: { version: 'desc' }, take: 1 } } },
      contractorLink: {
        include: {
          contractor: { select: { id: true, firstName: true, lastName: true } },
          agency:     { select: { id: true, name: true } },
          umbrella:   { select: { id: true, name: true } },
        },
      },
      payments: true,
    },
  })
  if (!invoice) throw createError('Invoice not found.', 404)
  return invoice
}

export const getInvoices = async (filters = {}) => {
  const { status, agencyId, umbrellaId } = filters
  return prisma.invoice.findMany({
    where: {
      ...(status     && { status }),
      ...(agencyId   && { agencyId }),
      ...(umbrellaId && { umbrellaId }),
    },
    include: {
      timesheet: {
        select: { id: true, periodStart: true, periodEnd: true },
      },
      contractorLink: {
        include: {
          contractor: { select: { id: true, firstName: true, lastName: true } },
          agency:     { select: { id: true, name: true } },
          umbrella:   { select: { id: true, name: true } },
        },
      },
      payments: {
        select: { id: true, amount: true, matchStatus: true, paymentReference: true },
      },
      payroll: {
        select: {
          id:          true,
          status:      true,
          grossPay:    true,
          netPay:      true,
          disbursedAt: true,
          taxYear:     true,
          rtiSubmission:  true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export const getOpenExceptions = async () => {
  return prisma.exception.findMany({
    where:   { status: 'OPEN' },
    orderBy: { createdAt: 'asc' },
  })
}