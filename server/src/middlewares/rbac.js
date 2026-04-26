import { sendError } from '../utils/response.js'

/**
 * requireRoles(...roles)
 * Checks that req.user holds at least one of the specified roles
 * across any of their active memberships.
 *
 * Usage:
 *   router.post('/orgs', authenticate, requireRoles('PLATFORM_ADMIN'), createOrg)
 *   router.post('/timesheets', authenticate, requireRoles('CONTRACTOR'), submitTimesheet)
 */
export const requireRoles = (...allowedRoles) => (req, res, next) => {
  const { user } = req
  if (!user) return sendError(res, 'Unauthenticated.', 401)

  const userRoles = user.memberships.map((m) => m.role)
  const hasRole   = allowedRoles.some((role) => userRoles.includes(role))

  if (!hasRole) {
    return sendError(
      res,
      `Access denied. Required role(s): ${allowedRoles.join(', ')}.`,
      403,
    )
  }

  next()
}

/**
 * requireOrgAccess(orgIdParam)
 * Checks that req.user is an active member of the organisation
 * referenced by the route param (defaults to 'organisationId').
 *
 * Usage:
 *   router.get('/orgs/:organisationId', authenticate, requireOrgAccess(), getOrg)
 */
export const requireOrgAccess = (paramName = 'organisationId') => (req, res, next) => {
  const { user } = req
  if (!user) return sendError(res, 'Unauthenticated.', 401)

  const orgId = req.params[paramName]
  if (!orgId) return next() // No org param — skip org check

  // PLATFORM_ADMIN bypasses org-level checks
  const isPlatformAdmin = user.memberships.some((m) => m.role === 'PLATFORM_ADMIN')
  if (isPlatformAdmin) return next()

  const isMember = user.memberships.some((m) => m.organisationId === orgId)
  if (!isMember) {
    return sendError(res, 'Access denied. You are not a member of this organisation.', 403)
  }

  next()
}

/**
 * requireOrgRole(orgIdParam, ...roles)
 * Combines org membership check with role check within that specific org.
 *
 * Usage:
 *   router.post('/orgs/:organisationId/members', authenticate,
 *     requireOrgRole('organisationId', 'AGENCY_ADMIN', 'UMBRELLA_ADMIN'), addMember)
 */
export const requireOrgRole = (paramName = 'organisationId', ...allowedRoles) => (req, res, next) => {
  const { user } = req
  if (!user) return sendError(res, 'Unauthenticated.', 401)

  const orgId = req.params[paramName]

  // PLATFORM_ADMIN bypasses all org-level role checks
  const isPlatformAdmin = user.memberships.some((m) => m.role === 'PLATFORM_ADMIN')
  if (isPlatformAdmin) return next()

  const membership = user.memberships.find((m) => m.organisationId === orgId)
  if (!membership) {
    return sendError(res, 'Access denied. You are not a member of this organisation.', 403)
  }

  if (!allowedRoles.includes(membership.role)) {
    return sendError(
      res,
      `Access denied. Required role(s) within this organisation: ${allowedRoles.join(', ')}.`,
      403,
    )
  }

  next()
}