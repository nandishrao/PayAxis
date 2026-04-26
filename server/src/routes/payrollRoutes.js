import { Router } from 'express'
import { triggerPayroll, getPayroll, getPayslip, myPayslips } from '../controllers/payrollController.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/rbac.js'
import { validate } from '../utils/validators.js'
import { runPayrollSchema } from '../utils/payrollValidator.js'

const router = Router()

router.use(authenticate)

// POST /api/payroll/run/:invoiceId
// Only payroll operators and umbrella admins can trigger payroll
router.post(
  '/run/:invoiceId',
  requireRoles('PAYROLL_OPERATOR', 'UMBRELLA_ADMIN', 'PLATFORM_ADMIN'),
  validate(runPayrollSchema),
  triggerPayroll,
)

// GET /api/payroll/:payrollId
router.get(
  '/:payrollId',
  requireRoles('PAYROLL_OPERATOR', 'UMBRELLA_ADMIN', 'PLATFORM_ADMIN', 'CONTRACTOR'),
  getPayroll,
)

// GET /api/payroll/payslips/me
// Contractor views their own payslips
router.get(
  '/payslips/me',
  requireRoles('CONTRACTOR'),
  myPayslips,
)

// GET /api/payroll/payslips/:payslipId
router.get(
  '/payslips/:payslipId',
  requireRoles('PAYROLL_OPERATOR', 'UMBRELLA_ADMIN', 'PLATFORM_ADMIN', 'CONTRACTOR'),
  getPayslip,
)

export default router