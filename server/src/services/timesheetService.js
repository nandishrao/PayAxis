import prisma from '../config/prisma.js'
import { createError } from '../middlewares/errorHandler.js'
import { createAuditLog } from './auditService.js'
import { autoGenerateInvoice } from './invoiceService.js'

// ── Helpers ───────────────────────────────────

const calcTotal = (data) =>
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    .reduce((sum, day) => sum + parseFloat(data[`hours${day}`] || 0), 0)

// ── Submit (create or resubmit) ───────────────

export const submitTimesheet = async (
  { contractorLinkId, periodStart, periodEnd, hours, notes },
  contractorId,
) => {
  const link = await prisma.contractorLink.findFirst({
    where: { id: contractorLinkId, contractorId, isActive: true },
  })
  if (!link) throw createError('Contractor link not found.', 404)

  const totalHours = calcTotal(hours)
  if (totalHours <= 0)   throw createError('Total hours must be greater than zero.', 422)
  if (totalHours > 168)  throw createError('Total hours cannot exceed 168 per week.', 422)

  const existing = await prisma.timesheet.findFirst({
    where: {
      contractorLinkId,
      periodStart: new Date(periodStart),
      periodEnd:   new Date(periodEnd),
      status:      { not: 'WORK_APPROVED' },
    },
  })

  if (existing?.lockedAt) {
    throw createError('This timesheet is locked and cannot be modified.', 409)
  }

  let timesheet

  if (existing) {
    const updated = await prisma.timesheet.updateMany({
      where: { id: existing.id, lockVersion: existing.lockVersion },
      data:  {
        status:         'WORK_SUBMITTED',
        currentVersion: existing.currentVersion + 1,
        lockVersion:    existing.lockVersion + 1,
      },
    })
    if (updated.count === 0) {
      throw createError('Timesheet was modified by another request. Please retry.', 409)
    }
    timesheet = await prisma.timesheet.findUnique({ where: { id: existing.id } })
  } else {
    timesheet = await prisma.timesheet.create({
      data: {
        contractorLinkId,
        contractorId,
        periodStart:    new Date(periodStart),
        periodEnd:      new Date(periodEnd),
        status:         'WORK_SUBMITTED',
        currentVersion: 1,
        lockVersion:    1,
      },
    })
  }

  const version = await prisma.timesheetVersion.create({
    data: {
      timesheetId:    timesheet.id,
      version:        timesheet.currentVersion,
      hoursMonday:    hours.hoursMonday    || 0,
      hoursTuesday:   hours.hoursTuesday   || 0,
      hoursWednesday: hours.hoursWednesday || 0,
      hoursThursday:  hours.hoursThursday  || 0,
      hoursFriday:    hours.hoursFriday    || 0,
      hoursSaturday:  hours.hoursSaturday  || 0,
      hoursSunday:    hours.hoursSunday    || 0,
      totalHours,
      notes,
      submittedAt: new Date(),
    },
  })

  await createAuditLog({
    actorId:   contractorId,
    actorRole: 'CONTRACTOR',
    eventType: 'TIMESHEET_SUBMITTED',
    metadata:  { timesheetId: timesheet.id, version: timesheet.currentVersion, totalHours },
  })

  return { timesheet, version }
}

// ── Approve ───────────────────────────────────

export const approveTimesheet = async (timesheetId, agencyUserId, agencyRole) => {
  const timesheet = await prisma.timesheet.findUnique({
    where:   { id: timesheetId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  })

  if (!timesheet) throw createError('Timesheet not found.', 404)
  if (timesheet.status !== 'WORK_SUBMITTED') {
    throw createError(`Cannot approve a timesheet with status: ${timesheet.status}.`, 409)
  }

  const updated = await prisma.timesheet.updateMany({
    where: { id: timesheetId, lockVersion: timesheet.lockVersion },
    data:  {
      status:      'WORK_APPROVED',
      lockedAt:    new Date(),
      lockVersion: timesheet.lockVersion + 1,
    },
  })
  if (updated.count === 0) {
    throw createError('Timesheet was modified concurrently. Please retry.', 409)
  }

  await prisma.timesheetVersion.update({
    where: { timesheetId_version: { timesheetId, version: timesheet.currentVersion } },
    data:  { approvedAt: new Date(), approvedById: agencyUserId },
  })

  await createAuditLog({
    actorId:     agencyUserId,
    actorRole:   agencyRole,
    eventType:   'TIMESHEET_APPROVED',
    beforeState: 'WORK_SUBMITTED',
    afterState:  'WORK_APPROVED',
    metadata:    { timesheetId },
  })

  // Auto-trigger invoice generation — Phase 4
  await autoGenerateInvoice(timesheetId)

  return prisma.timesheet.findUnique({
    where:   { id: timesheetId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 }, invoice: true },
  })
}

// ── Reject ────────────────────────────────────

export const rejectTimesheet = async (timesheetId, rejectionReason, agencyUserId, agencyRole) => {
  if (!rejectionReason?.trim()) {
    throw createError('A rejection reason is required.', 422)
  }

  const timesheet = await prisma.timesheet.findUnique({ where: { id: timesheetId } })
  if (!timesheet) throw createError('Timesheet not found.', 404)
  if (timesheet.status !== 'WORK_SUBMITTED') {
    throw createError(`Cannot reject a timesheet with status: ${timesheet.status}.`, 409)
  }

  const updated = await prisma.timesheet.updateMany({
    where: { id: timesheetId, lockVersion: timesheet.lockVersion },
    data:  {
      status:      'WORK_REJECTED',
      lockVersion: timesheet.lockVersion + 1,
    },
  })
  if (updated.count === 0) {
    throw createError('Timesheet was modified concurrently. Please retry.', 409)
  }

  await prisma.timesheetVersion.update({
    where: { timesheetId_version: { timesheetId, version: timesheet.currentVersion } },
    data:  { rejectedAt: new Date(), rejectionReason },
  })

  await createAuditLog({
    actorId:     agencyUserId,
    actorRole:   agencyRole,
    eventType:   'TIMESHEET_REJECTED',
    beforeState: 'WORK_SUBMITTED',
    afterState:  'WORK_REJECTED',
    metadata:    { timesheetId, rejectionReason },
  })

  return prisma.timesheet.findUnique({
    where:   { id: timesheetId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  })
}

// ── Queries ───────────────────────────────────

export const getTimesheetById = async (timesheetId, requestingUserId) => {
  const timesheet = await prisma.timesheet.findUnique({
    where:   { id: timesheetId },
    include: {
      versions:      { orderBy: { version: 'desc' } },
      invoice:       true,
      contractorLink: {
        include: {
          agency:   { select: { id: true, name: true } },
          umbrella: { select: { id: true, name: true } },
        },
      },
    },
  })
  if (!timesheet) throw createError('Timesheet not found.', 404)

  const isOwner = timesheet.contractorId === requestingUserId
  if (!isOwner) {
    const membership = await prisma.membership.findFirst({
      where: {
        userId:         requestingUserId,
        isActive:       true,
        organisationId: timesheet.contractorLink.agencyId,
      },
    })
    if (!membership) throw createError('Access denied.', 403)
  }

  return timesheet
}

// Replace getTimesheets in your timesheetService.js
export const getTimesheets = async (requestingUser, filters = {}) => {
  const { status, contractorLinkId } = filters
 
  const userRoles       = requestingUser.memberships.map((m) => m.role)
  const isContractor    = userRoles.includes('CONTRACTOR')
  const isPlatformAdmin = userRoles.includes('PLATFORM_ADMIN')
 
  const userOrgIds = requestingUser.memberships
    .map((m) => m.organisationId)
    .filter(Boolean)
 
  // ── DEBUG ─────────────────────────────────────
  console.log('=== getTimesheets DEBUG ===')
  console.log('userId:', requestingUser.id)
  console.log('roles:', userRoles)
  console.log('isContractor:', isContractor)
  console.log('isPlatformAdmin:', isPlatformAdmin)
  console.log('userOrgIds:', userOrgIds)
  console.log('filters:', filters)
  // ─────────────────────────────────────────────
 
  const where = {
    ...(status           && { status }),
    ...(contractorLinkId && { contractorLinkId }),
    ...(isContractor     && { contractorId: requestingUser.id }),
    ...(!isContractor && !isPlatformAdmin && userOrgIds.length > 0 && {
      contractorLink: {
        agencyId: { in: userOrgIds },
      },
    }),
  }
 
  console.log('Prisma where clause:', JSON.stringify(where, null, 2))
 
  const results = await prisma.timesheet.findMany({
    where,
    include: {
      versions: { orderBy: { version: 'desc' }, take: 1 },
      invoice:  { select: { id: true, invoiceNumber: true, status: true, grossAmount: true } },
      contractorLink: {
        include: {
          agency:     { select: { id: true, name: true } },
          umbrella:   { select: { id: true, name: true } },
          contractor: { select: { id: true, firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
 
  console.log('Results count:', results.length)
  console.log('=== END DEBUG ===')
 
  return results
}