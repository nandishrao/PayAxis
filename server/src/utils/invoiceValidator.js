import { z } from 'zod'

export const approveInvoiceSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID.'),
})

export const webhookPaymentSchema = z.object({
  paymentReference:  z.string().min(1, 'Payment reference is required.'),
  amountReceived:    z.number().positive('Amount must be positive.'),
  currency:          z.string().length(3).default('GBP'),
  bankSource:        z.string().optional(),
  rawWebhookPayload: z.record(z.unknown()).optional(),
})

export const resolveExceptionSchema = z.object({
  resolutionNote: z.string().min(1, 'Resolution note is required.').max(2000),
})