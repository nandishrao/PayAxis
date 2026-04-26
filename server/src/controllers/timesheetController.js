import {
  submitTimesheet,
  approveTimesheet,
  rejectTimesheet,
  getTimesheetById,
  getTimesheets,
} from '../services/timesheetService.js'
import { sendSuccess } from '../utils/response.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

export const submit = asyncHandler(async (req, res) => {
  const result = await submitTimesheet(req.body, req.user.id)
  return sendSuccess(res, result, 201, 'Timesheet submitted successfully.')
})

export const approve = asyncHandler(async (req, res) => {
  const { timesheetId } = req.params
  const membership = req.user.memberships.find(
    (m) => m.role === 'AGENCY_ADMIN' || m.role === 'AGENCY_CONSULTANT',
  )
  const result = await approveTimesheet(timesheetId, req.user.id, membership?.role)
  return sendSuccess(res, result, 200, 'Timesheet approved.')
})

export const reject = asyncHandler(async (req, res) => {
  const { timesheetId } = req.params
  const { rejectionReason } = req.body
  const membership = req.user.memberships.find(
    (m) => m.role === 'AGENCY_ADMIN' || m.role === 'AGENCY_CONSULTANT',
  )
  const result = await rejectTimesheet(timesheetId, rejectionReason, req.user.id, membership?.role)
  return sendSuccess(res, result, 200, 'Timesheet rejected.')
})

export const getOne = asyncHandler(async (req, res) => {
  const timesheet = await getTimesheetById(req.params.timesheetId, req.user.id)
  return sendSuccess(res, { timesheet })
})

export const getAll = asyncHandler(async (req, res) => {
  const filters = {
    status:           req.query.status,
    contractorLinkId: req.query.contractorLinkId,
  }
  const timesheets = await getTimesheets(req.user, filters)
  return sendSuccess(res, { timesheets, count: timesheets.length })
})