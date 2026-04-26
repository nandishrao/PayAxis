import { raiseException, resolveException, escalateException, getExceptions, getExceptionById } from '../services/exceptionService.js'
import { sendSuccess } from '../utils/response.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

export const raise = asyncHandler(async (req, res) => {
  const exception = await raiseException(req.body)
  return sendSuccess(res, { exception }, 201, 'Exception raised.')
})

export const resolve = asyncHandler(async (req, res) => {
  const membership = req.user.memberships[0]
  const exception  = await resolveException(req.params.exceptionId, req.body, req.user.id, membership?.role)
  return sendSuccess(res, { exception }, 200, 'Exception resolved.')
})

export const escalate = asyncHandler(async (req, res) => {
  const membership = req.user.memberships[0]
  const exception  = await escalateException(req.params.exceptionId, req.user.id, membership?.role)
  return sendSuccess(res, { exception }, 200, 'Exception escalated.')
})

export const getAll = asyncHandler(async (req, res) => {
  const exceptions = await getExceptions(req.user, {
    status: req.query.status,
    type:   req.query.type,
  })
  return sendSuccess(res, { exceptions, count: exceptions.length })
})

export const getOne = asyncHandler(async (req, res) => {
  const exception = await getExceptionById(req.params.exceptionId, req.user)
  return sendSuccess(res, { exception })
})