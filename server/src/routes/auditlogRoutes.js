import { Router } from 'express'
import { getLogs, getLogsByEntity } from '../controllers/auditlogController.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles } from '../middlewares/rbac.js'

const router = Router()
router.use(authenticate)

// GET /api/audit-logs
router.get(
  '/',
  requireRoles('PLATFORM_ADMIN'),
  getLogs,
)

// GET /api/audit-logs/entity/:entityId
router.get(
  '/entity/:entityId',
  requireRoles('PLATFORM_ADMIN', 'UMBRELLA_ADMIN', 'PAYROLL_OPERATOR'),
  getLogsByEntity,
)

export default router