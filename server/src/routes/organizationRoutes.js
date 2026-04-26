import { Router } from 'express'
import { create, getOne, addOrgMember, createContractorLink } from '../controllers/organizationController.js'
import { authenticate } from '../middlewares/authenticate.js'
import { requireRoles, requireOrgAccess, requireOrgRole } from '../middlewares/rbac.js'
import { validate, createOrgSchema, addMemberSchema, linkContractorSchema } from '../utils/validators.js'

const router = Router()

// All org routes require authentication
router.use(authenticate)

// POST /api/organisations
// Only platform admins can create organisations
router.post(
  '/',
  requireRoles('PLATFORM_ADMIN'),
  validate(createOrgSchema),
  create,
)

// GET /api/organisations/:organisationId
// Any member of the org can view it
router.get(
  '/:organisationId',
  requireOrgAccess('organisationId'),
  getOne,
)

// POST /api/organisations/:organisationId/members
// Only org admins can add members
router.post(
  '/:organisationId/members',
  requireRoles('PLATFORM_ADMIN', 'AGENCY_ADMIN', 'UMBRELLA_ADMIN'),
  validate(addMemberSchema),
  addOrgMember,
)

// POST /api/organisations/contractors/link
// Agency admins link contractors to agencies + umbrella companies
router.post(
  '/contractors/link',
  requireRoles('AGENCY_ADMIN', 'PLATFORM_ADMIN'),
  validate(linkContractorSchema),
  createContractorLink,
)

export default router