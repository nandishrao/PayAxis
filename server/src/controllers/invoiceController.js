import {
  approveInvoice,
  handleIncomingPayment,
  resolvePaymentException,
  getInvoiceById,
  getInvoices,
  getOpenExceptions,
  markPaymentPending
} from '../services/invoiceService.js'
import { sendSuccess } from '../utils/response.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

export const getAll = asyncHandler(async (req, res) => {
  const filters = {
    status:     req.query.status,
    agencyId:   req.query.agencyId,
    umbrellaId: req.query.umbrellaId,
  }
  const invoices = await getInvoices(filters)
  return sendSuccess(res, { invoices, count: invoices.length })
})

export const getOne = asyncHandler(async (req, res) => {
  const invoice = await getInvoiceById(req.params.invoiceId)
  return sendSuccess(res, { invoice })
})

export const markPending = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params
  const membership = req.user.memberships.find(
    (m) => m.role === 'AGENCY_ADMIN' || m.role === 'AGENCY_CONSULTANT',
  )
  const invoice = await markPaymentPending(invoiceId, req.user.id, membership?.role)
  return sendSuccess(res, { invoice }, 200, 'Invoice marked as payment pending.')
})

export const approve = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params
  const membership = req.user.memberships.find(
    (m) => m.role === 'AGENCY_ADMIN' || m.role === 'AGENCY_CONSULTANT',
  )
  const invoice = await approveInvoice(invoiceId, req.user.id, membership?.role)
  return sendSuccess(res, { invoice }, 200, 'Invoice approved. Payment pending.')
})

export const paymentWebhook = asyncHandler(async (req, res) => {
  // This endpoint is called by the banking integration / webhook handler.
  // In production, secure this with a webhook signature verification middleware.
  const result = await handleIncomingPayment(req.body)
  return sendSuccess(res, result, 200, 'Payment webhook processed.')
})

export const listExceptions = asyncHandler(async (req, res) => {
  const exceptions = await getOpenExceptions()
  return sendSuccess(res, { exceptions, count: exceptions.length })
})

export const resolveException = asyncHandler(async (req, res) => {
  const { exceptionId } = req.params
  const membership = req.user.memberships[0]
  const resolved = await resolvePaymentException(
    exceptionId,
    req.body,
    req.user.id,
    membership?.role,
  )
  return sendSuccess(res, { exception: resolved }, 200, 'Exception resolved.')
})