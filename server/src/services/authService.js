import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'
import env from '../config/env.js'
import { createError } from '../middlewares/errorHandler.js'
import { createAuditLog } from './auditService.js'

// ── Helpers ───────────────────────────────────

const signToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })

const hashPassword = (password) => bcrypt.hash(password, 12)

const verifyPassword = (plain, hashed) => bcrypt.compare(plain, hashed)

// ── Auth operations ───────────────────────────

export const registerUser = async ({ email, password, firstName, lastName }) => {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw createError('Email already registered.', 409)

  const passwordHash = await hashPassword(password)

  const user = await prisma.user.create({
    data: { email, passwordHash, firstName, lastName },
    select: { id: true, email: true, firstName: true, lastName: true, createdAt: true },
  })

  await createAuditLog({
    actorId:   user.id,
    eventType: 'USER_REGISTERED',
    metadata:  { email },
  })

  const token = signToken({ userId: user.id })
  return { user, token }
}

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        where:   { isActive: true },
        include: { organisation: { select: { id: true, name: true, type: true } } },
      },
    },
  })

  if (!user || !user.isActive) throw createError('Invalid credentials.', 401)

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw createError('Invalid credentials.', 401)

  await createAuditLog({
    actorId:   user.id,
    eventType: 'USER_LOGIN',
    metadata:  { email },
  })

  const token = signToken({ userId: user.id })
  console.log(token)
  const { passwordHash, ...safeUser } = user
  return { user: safeUser, token }
}

export const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id:        true,
      email:     true,
      firstName: true,
      lastName:  true,
      isActive:  true,
      createdAt: true,
      memberships: {
        where:   { isActive: true },
        select: {
          role: true,
          organisation: { select: { id: true, name: true, type: true } },
        },
      },
      contractorLinks: {
        where:  { isActive: true },
        select: {
          id:                true,
          agreedRatePerHour: true,
          currency:          true,
          agency:   { select: { id: true, name: true } },
          umbrella: { select: { id: true, name: true } },
        },
      },
    },
  })

  if (!user) throw createError('User not found.', 404)
  return user
}