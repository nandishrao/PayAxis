import prisma from '../config/prisma.js'
import { createError } from '../middlewares/errorHandler.js'
import { createAuditLog } from './auditService.js'

// ── Raise an exception ────────────────────────

export const raiseException = async ({
  type,
  title,
  description,
  relatedEntityId   = null,
  relatedEntityType = null,
  organisationId    = null,
  assignedToId      = null,
}) => {
  const exception = await prisma.exception.create({
    data: {
      type,
      title,
      description,
      relatedEntityId,
      relatedEntityType,
      organisationId,
      assignedToId,
      status: 'OPEN',
    },
  })

  await createAuditLog({
    organisationId,
    eventType: 'EXCEPTION_RAISED',
    metadata:  { exceptionId: exception.id, type, title },
  })

  return exception
}

// ── Resolve an exception ──────────────────────

export const resolveException = async (exceptionId, { resolutionNote, isManualOverride, overrideJustification }, actorId, actorRole) => {
  const exception = await prisma.exception.findUnique({ where: { id: exceptionId } })
  if (!exception) throw createError('Exception not found.', 404)
  if (exception.status === 'RESOLVED') throw createError('Exception is already resolved.', 409)

  // Manual overrides require a written justification — stored permanently
  if (isManualOverride && !overrideJustification?.trim()) {
    throw createError('A written justification is required for manual overrides.', 422)
  }

  const resolved = await prisma.exception.update({
    where: { id: exceptionId },
    data: {
      status:               'RESOLVED',
      resolvedAt:           new Date(),
      resolvedById:         actorId,
      resolutionNote,
      isManualOverride:     isManualOverride ?? false,
      overrideJustification: isManualOverride ? overrideJustification : null,
    },
  })

  await createAuditLog({
    actorId,
    actorRole,
    eventType: 'EXCEPTION_RESOLVED',
    metadata:  {
      exceptionId,
      isManualOverride,
      overrideJustification: isManualOverride ? overrideJustification : undefined,
    },
  })

  return resolved
}

// ── Escalate an exception ─────────────────────

export const escalateException = async (exceptionId, actorId, actorRole) => {
  const exception = await prisma.exception.findUnique({ where: { id: exceptionId } })
  if (!exception) throw createError('Exception not found.', 404)
  if (exception.status === 'RESOLVED') throw createError('Cannot escalate a resolved exception.', 409)

  const escalated = await prisma.exception.update({
    where: { id: exceptionId },
    data:  { status: 'ESCALATED' },
  })

  await createAuditLog({
    actorId,
    actorRole,
    eventType: 'EXCEPTION_ESCALATED',
    metadata:  { exceptionId },
  })

  return escalated
}

// ── Queries ───────────────────────────────────

export const getExceptions = async (requestingUser, filters = {}) => {
  const { status, type } = filters
  const isPlatformAdmin  = requestingUser.memberships.some((m) => m.role === 'PLATFORM_ADMIN')
  const userOrgIds       = requestingUser.memberships.map((m) => m.organisationId)

  const where = {
    ...(status && { status }),
    ...(type   && { type }),
    ...(!isPlatformAdmin && {
      organisationId: { in: userOrgIds },
    }),
  }

  return prisma.exception.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export const getExceptionById = async (exceptionId, requestingUser) => {
  const exception = await prisma.exception.findUnique({ where: { id: exceptionId } })
  if (!exception) throw createError('Exception not found.', 404)

  const isPlatformAdmin = requestingUser.memberships.some((m) => m.role === 'PLATFORM_ADMIN')
  const userOrgIds      = requestingUser.memberships.map((m) => m.organisationId)
  const hasAccess       = isPlatformAdmin || userOrgIds.includes(exception.organisationId)
  if (!hasAccess) throw createError('Access denied.', 403)

  return exception
}