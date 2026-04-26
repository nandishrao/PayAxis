import jwt from 'jsonwebtoken'
import prisma from '../config/prisma.js'
import env from '../config/env.js'
import { sendError } from '../utils/response.js'

/**
 * authenticate
 * Verifies the JWT, loads the user + their memberships, and attaches to req.user.
 * Every protected route must use this middleware first.
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return sendError(res, 'No token provided.', 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, env.JWT_SECRET)

    const user = await prisma.user.findUnique({
      where:   { id: decoded.userId },
      select: {
        id:        true,
        email:     true,
        firstName: true,
        lastName:  true,
        isActive:  true,
        memberships: {
          where:  { isActive: true },
          select: {
            role:           true,
            organisationId: true,
            organisation: { select: { id: true, name: true, type: true } },
          },
        },
      },
    })

    if (!user || !user.isActive) {
      return sendError(res, 'User not found or inactive.', 401)
    }

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return sendError(res, 'Token expired.', 401)
    if (err.name === 'JsonWebTokenError') return sendError(res, 'Invalid token.', 401)
    next(err)
  }
}