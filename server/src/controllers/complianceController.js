import { validatePrePayroll, submitToHMRC, retrySubmission, getSubmissionByPayroll } from '../services/complianceService.js'
import { sendSuccess } from '../utils/response.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

export const validate = asyncHandler(async (req, res) => {
  const result = await validatePrePayroll(req.params.invoiceId)
  return sendSuccess(res, result, 200, result.passed ? 'Validation passed.' : 'Validation failed.')
})

export const submit = asyncHandler(async (req, res) => {
  const membership = req.user.memberships.find(
    (m) => m.role === 'PAYROLL_OPERATOR' || m.role === 'UMBRELLA_ADMIN',
  )
  const submission = await submitToHMRC(req.params.payrollId, req.user.id, membership?.role)
  return sendSuccess(res, { submission }, 201, 'HMRC RTI submission successful.')
})

export const retry = asyncHandler(async (req, res) => {
  const membership = req.user.memberships.find(
    (m) => m.role === 'PAYROLL_OPERATOR' || m.role === 'UMBRELLA_ADMIN',
  )
  const submission = await retrySubmission(req.params.submissionId, req.user.id, membership?.role)
  return sendSuccess(res, { submission }, 200, 'Submission retried.')
})

export const getByPayroll = asyncHandler(async (req, res) => {
  const submission = await getSubmissionByPayroll(req.params.payrollId, req.user)
  return sendSuccess(res, { submission })
})