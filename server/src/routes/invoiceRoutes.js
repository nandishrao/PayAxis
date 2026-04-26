import { Router } from 'express'
import {
  getAll,
  getOne,
  approve,
  markPending,
  paymentWebhook,
  listExceptions,
  resolveException,
} from '../controllers/invoiceController.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/rbac.js'
import { validate } from '../utils/validators.js'
import {
  webhookPaymentSchema,
  resolveExceptionSchema,
} from '../utils/invoiceValidator.js'

const router = Router()

// ── Public webhook (secured by signature in production) ──
// POST /api/invoices/webhook/payment
router.post(
  '/webhook/payment',
  validate(webhookPaymentSchema),
  paymentWebhook,
)

// ── All routes below require authentication ───
router.use(authenticate)

// GET /api/invoices
router.get(
  '/',
  requireRoles('AGENCY_ADMIN', 'AGENCY_CONSULTANT', 'UMBRELLA_ADMIN', 'PAYROLL_OPERATOR', 'PLATFORM_ADMIN'),
  getAll,
)

// GET /api/invoices/exceptions
router.get(
  '/exceptions',
  requireRoles('UMBRELLA_ADMIN', 'PAYROLL_OPERATOR', 'PLATFORM_ADMIN'),
  listExceptions,
)

// GET /api/invoices/:invoiceId
router.get(
  '/:invoiceId',
  requireRoles('AGENCY_ADMIN', 'AGENCY_CONSULTANT', 'UMBRELLA_ADMIN', 'PAYROLL_OPERATOR', 'PLATFORM_ADMIN'),
  getOne,
)
// PATCH /api/invoices/:invoiceId/payment-pending
router.patch(
  '/:invoiceId/payment-pending',
  requireRoles('AGENCY_ADMIN', 'AGENCY_CONSULTANT'),
  markPending,
)

// PATCH /api/invoices/:invoiceId/approve
router.patch(
  '/:invoiceId/approve',
  requireRoles('AGENCY_ADMIN', 'AGENCY_CONSULTANT'),
  approve,
)

// PATCH /api/invoices/exceptions/:exceptionId/resolve
router.patch(
  '/exceptions/:exceptionId/resolve',
  requireRoles('UMBRELLA_ADMIN', 'PAYROLL_OPERATOR', 'PLATFORM_ADMIN'),
  validate(resolveExceptionSchema),
  resolveException,
)

export default router