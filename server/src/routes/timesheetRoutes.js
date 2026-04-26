import { Router } from 'express'
import { submit, approve, reject, getOne, getAll } from '../controllers/timesheetController.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/rbac.js'
import { validate } from '../utils/validators.js'
import {
  submitTimesheetSchema,
  rejectTimesheetSchema,
} from '../utils/timesheetValidator.js'

const router = Router()

router.use(authenticate)

// GET  /api/timesheets
router.get(
  '/',
  requireRoles('CONTRACTOR', 'AGENCY_ADMIN', 'AGENCY_CONSULTANT', 'UMBRELLA_ADMIN', 'PAYROLL_OPERATOR', 'PLATFORM_ADMIN'),
  getAll,
)

// GET  /api/timesheets/:timesheetId
router.get(
  '/:timesheetId',
  requireRoles('CONTRACTOR', 'AGENCY_ADMIN', 'AGENCY_CONSULTANT', 'UMBRELLA_ADMIN', 'PAYROLL_OPERATOR', 'PLATFORM_ADMIN'),
  getOne,
)

// POST /api/timesheets
router.post(
  '/',
  requireRoles('CONTRACTOR'),
  validate(submitTimesheetSchema),
  submit,
)

// PATCH /api/timesheets/:timesheetId/approve
router.patch(
  '/:timesheetId/approve',
  requireRoles('AGENCY_ADMIN', 'AGENCY_CONSULTANT'),
  approve,
)

// PATCH /api/timesheets/:timesheetId/reject
router.patch(
  '/:timesheetId/reject',
  requireRoles('AGENCY_ADMIN', 'AGENCY_CONSULTANT'),
  validate(rejectTimesheetSchema),
  reject,
)

export default router