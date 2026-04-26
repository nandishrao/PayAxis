import { Router } from 'express'
import prisma from '../config/prisma.js'
import { sendSuccess, sendError } from '../utils/response.js'

const router = Router()

// GET /api/health
router.get('/', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return sendSuccess(res, {
      status:    'healthy',
      database:  'connected',
      timestamp: new Date().toISOString(),
      uptime:    `${Math.floor(process.uptime())}s`,
    })
  } catch {
    return sendError(res, 'Database unreachable', 503, null)
  }
})

export default router