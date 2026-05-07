import { getAuditLogs, getAuditLogsByEntity } from '../services/auditlogService.js'
import { sendSuccess } from '../utils/response.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

export const getLogs = asyncHandler(async (req, res) => {
  const logs = await getAuditLogs(req.user, req.query)
  return sendSuccess(res, { logs, count: logs.length })
})

export const getLogsByEntity = asyncHandler(async (req, res) => {
  const logs = await getAuditLogsByEntity(req.params.entityId, req.user)
  return sendSuccess(res, { logs, count: logs.length })
})