import { runPayroll, getPayrollById, getPayslipById, getMyPayslips } from '../services/payrollService.js'
import { sendSuccess } from '../utils/response.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

export const triggerPayroll = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params
  const membership = req.user.memberships.find(
    (m) => m.role === 'PAYROLL_OPERATOR' || m.role === 'UMBRELLA_ADMIN',
  )
  const result = await runPayroll(invoiceId, req.user.id, membership?.role, req.body)
  return sendSuccess(res, result, 201, 'Payroll processed and payslip generated.')
})

export const getPayroll = asyncHandler(async (req, res) => {
  const payroll = await getPayrollById(req.params.payrollId, req.user)
  return sendSuccess(res, { payroll })
})

export const getPayslip = asyncHandler(async (req, res) => {
  const payslip = await getPayslipById(req.params.payslipId, req.user)
  return sendSuccess(res, { payslip })
})

export const myPayslips = asyncHandler(async (req, res) => {
  const payslips = await getMyPayslips(req.user.id)
  return sendSuccess(res, { payslips, count: payslips.length })
})