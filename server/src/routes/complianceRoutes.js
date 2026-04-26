import { Router } from 'express'
import { validate, submit, retry, getByPayroll } from '../controllers/complianceController.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/rbac.js'

const router = Router()
router.use(authenticate)

// GET  /api/compliance/validate/:invoiceId
router.get(
  '/validate/:invoiceId',
  requireRoles('PAYROLL_OPERATOR', 'UMBRELLA_ADMIN', 'PLATFORM_ADMIN'),
  validate,
)

// POST /api/compliance/submit/:payrollId
router.post(
  '/submit/:payrollId',
  requireRoles('PAYROLL_OPERATOR', 'UMBRELLA_ADMIN'),
  submit,
)

// POST /api/compliance/retry/:submissionId
router.post(
  '/retry/:submissionId',
  requireRoles('PAYROLL_OPERATOR', 'UMBRELLA_ADMIN'),
  retry,
)

// GET  /api/compliance/payroll/:payrollId
router.get(
  '/payroll/:payrollId',
  requireRoles('PAYROLL_OPERATOR', 'UMBRELLA_ADMIN', 'PLATFORM_ADMIN'),
  getByPayroll,
)

export default router