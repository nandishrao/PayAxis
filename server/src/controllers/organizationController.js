import {
  createOrganisation,
  getOrganisation,
  addMember,
  linkContractor,
} from '../services/organizationService.js'
import { sendSuccess } from '../utils/response.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

export const create = asyncHandler(async (req, res) => {
  const { role } = req.user.memberships.find((m) => m.role === 'PLATFORM_ADMIN') || {}
  const org = await createOrganisation(req.body, req.user.id, role)
  return sendSuccess(res, { organisation: org }, 201, 'Organisation created.')
})

export const getOne = asyncHandler(async (req, res) => {
  const org = await getOrganisation(req.params.organisationId, req.user.id)
  return sendSuccess(res, { organisation: org })
})

export const addOrgMember = asyncHandler(async (req, res) => {
  const membership = req.user.memberships.find(
    (m) => m.organisationId === req.params.organisationId,
  )
  const member = await addMember(
    { organisationId: req.params.organisationId, ...req.body },
    req.user.id,
    membership?.role,
  )
  return sendSuccess(res, { membership: member }, 201, 'Member added.')
})

export const createContractorLink = asyncHandler(async (req, res) => {
  const membership = req.user.memberships.find(
    (m) => m.organisationId === req.body.agencyId,
  )
  const link = await linkContractor(req.body, req.user.id, membership?.role)
  return sendSuccess(res, { link }, 201, 'Contractor linked successfully.')
})