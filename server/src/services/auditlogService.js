import prisma from '../config/prisma.js'
import { createError } from '../middlewares/errorHandler.js'

// ── Read-only audit log queries ───────────────
// No write operations here — writes go through audit.service.js only

export const getAuditLogs = async (requestingUser, filters = {}) => {
  const { eventType, actorId, workRecordId, from, to, limit = 100 } = filters

  const isPlatformAdmin = requestingUser.memberships.some((m) => m.role === 'PLATFORM_ADMIN')
  if (!isPlatformAdmin) throw createError('Access denied. Audit log requires PLATFORM_ADMIN role.', 403)

  const where = {
    ...(eventType    && { eventType }),
    ...(actorId      && { actorId }),
    ...(workRecordId && { workRecordId }),
    ...(from || to)  && {
      timestamp: {
        ...(from && { gte: new Date(from) }),
        ...(to   && { lte: new Date(to)   }),
      },
    },
  }

  return prisma.auditLog.findMany({
    where,
    include: {
      actor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { timestamp: 'desc' },
    take:    Math.min(parseInt(limit, 10), 500),
  })
}

export const getAuditLogsByEntity = async (entityId, requestingUser) => {
  const isPlatformAdmin  = requestingUser.memberships.some((m) => m.role === 'PLATFORM_ADMIN')
  const isUmbrellaMember = requestingUser.memberships.some(
    (m) => m.role === 'UMBRELLA_ADMIN' || m.role === 'PAYROLL_OPERATOR',
  )
  if (!isPlatformAdmin && !isUmbrellaMember) throw createError('Access denied.', 403)

  return prisma.auditLog.findMany({
    where: {
      OR: [
        { workRecordId:   entityId },
        { organisationId: entityId },
        { actorId:        entityId },
      ],
    },
    include: {
      actor: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    orderBy: { timestamp: 'desc' },
  })
}