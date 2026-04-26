import { Router } from 'express'
import { raise, resolve, escalate, getAll, getOne } from '../controllers/exceptionController.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/rbac.js'

const router = Router()
router.use(authenticate)

// GET  /api/exceptions
router.get(
  '/',
  requireRoles('PLATFORM_ADMIN', 'UMBRELLA_ADMIN', 'AGENCY_ADMIN', 'PAYROLL_OPERATOR'),
  getAll,
)

// GET  /api/exceptions/:exceptionId
router.get(
  '/:exceptionId',
  requireRoles('PLATFORM_ADMIN', 'UMBRELLA_ADMIN', 'AGENCY_ADMIN', 'PAYROLL_OPERATOR'),
  getOne,
)

// POST /api/exceptions
router.post(
  '/',
  requireRoles('PLATFORM_ADMIN', 'UMBRELLA_ADMIN', 'PAYROLL_OPERATOR'),
  raise,
)

// PATCH /api/exceptions/:exceptionId/resolve
router.patch(
  '/:exceptionId/resolve',
  requireRoles('PLATFORM_ADMIN', 'UMBRELLA_ADMIN', 'PAYROLL_OPERATOR'),
  resolve,
)

// PATCH /api/exceptions/:exceptionId/escalate
router.patch(
  '/:exceptionId/escalate',
  requireRoles('PLATFORM_ADMIN', 'UMBRELLA_ADMIN'),
  escalate,
)

export default router