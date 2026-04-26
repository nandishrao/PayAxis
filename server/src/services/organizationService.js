import prisma from '../config/prisma.js'
import { createError } from '../middlewares/errorHandler.js'
import { createAuditLog } from './auditService.js'

export const createOrganisation = async ({ name, type }, actorId, actorRole) => {
  const org = await prisma.organisation.create({
    data: { name, type },
    select: { id: true, name: true, type: true, isActive: true, createdAt: true },
  })

  await createAuditLog({
    actorId,
    actorRole,
    organisationId: org.id,
    eventType:      'ORGANISATION_CREATED',
    metadata:       { name, type },
  })

  return org
}

export const getOrganisation = async (orgId, requestingUserId) => {
  // Tenant check — user must be a member of this org (or platform admin, handled by RBAC)
  const membership = await prisma.membership.findFirst({
    where: { userId: requestingUserId, organisationId: orgId, isActive: true },
  })
  if (!membership) throw createError('Access denied.', 403)

  return prisma.organisation.findUnique({
    where: { id: orgId },
    select: {
      id:        true,
      name:      true,
      type:      true,
      isActive:  true,
      createdAt: true,
      memberships: {
        where:  { isActive: true },
        select: {
          role: true,
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
  })
}

export const addMember = async ({ organisationId, userId, role }, actorId, actorRole) => {
  // Validate org exists and is active
   console.log('DEBUG userId:', JSON.stringify(userId))
  console.log('DEBUG userId length:', userId?.length)
  const org = await prisma.organisation.findUnique({ where: { id: organisationId } })
  if (!org || !org.isActive) throw createError('Organisation not found.', 404)

  // Validate user exists
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || !user.isActive) throw createError('User not found.', 404)

  // Enforce role ↔ org type consistency
  const agencyRoles    = ['AGENCY_ADMIN', 'AGENCY_CONSULTANT']
  const umbrellaRoles  = ['UMBRELLA_ADMIN', 'PAYROLL_OPERATOR']

  if (org.type === 'AGENCY' && umbrellaRoles.includes(role)) {
    throw createError(`Role ${role} cannot be assigned within an Agency organisation.`, 422)
  }
  if (org.type === 'UMBRELLA' && agencyRoles.includes(role)) {
    throw createError(`Role ${role} cannot be assigned within an Umbrella organisation.`, 422)
  }

  const membership = await prisma.membership.upsert({
    where:  { userId_organisationId: { userId, organisationId } },
    update: { role, isActive: true },
    create: { userId, organisationId, role },
    select: { id: true, role: true, userId: true, organisationId: true, createdAt: true },
  })

  await createAuditLog({
    actorId,
    actorRole,
    organisationId,
    eventType: 'MEMBER_ADDED',
    metadata:  { userId, role },
  })

  return membership
}

export const linkContractor = async (
  { contractorId, agencyId, umbrellaId, agreedRatePerHour, currency = 'GBP' },
  actorId,
  actorRole,
) => {
  // Validate all three parties exist and are active
  const [contractor, agency, umbrella] = await Promise.all([
    prisma.user.findUnique({ where: { id: contractorId } }),
    prisma.organisation.findUnique({ where: { id: agencyId } }),
    prisma.organisation.findUnique({ where: { id: umbrellaId } }),
  ])

  if (!contractor || !contractor.isActive) throw createError('Contractor not found.', 404)
  if (!agency    || agency.type !== 'AGENCY')    throw createError('Agency not found.', 404)
  if (!umbrella  || umbrella.type !== 'UMBRELLA') throw createError('Umbrella company not found.', 404)

  // Contractor must be a CONTRACTOR role member of the agency
  const contractorMembership = await prisma.membership.findFirst({
    where: { userId: contractorId, organisationId: agencyId, role: 'CONTRACTOR', isActive: true },
  })
  if (!contractorMembership) {
    throw createError('Contractor must first be a member of the agency with CONTRACTOR role.', 422)
  }

  const link = await prisma.contractorLink.upsert({
    where:  { contractorId_agencyId_umbrellaId: { contractorId, agencyId, umbrellaId } },
    update: { agreedRatePerHour, currency, isActive: true },
    create: { contractorId, agencyId, umbrellaId, agreedRatePerHour, currency },
    select: {
      id:                true,
      agreedRatePerHour: true,
      currency:          true,
      contractor: { select: { id: true, firstName: true, lastName: true } },
      agency:     { select: { id: true, name: true } },
      umbrella:   { select: { id: true, name: true } },
    },
  })

  await createAuditLog({
    actorId,
    actorRole,
    organisationId: agencyId,
    eventType:      'CONTRACTOR_LINKED',
    metadata:       { contractorId, agencyId, umbrellaId, agreedRatePerHour },
  })

  return link
}