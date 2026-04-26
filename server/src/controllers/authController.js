import { registerUser, loginUser, getMe } from '../services/authService.js'
import { sendSuccess } from '../utils/response.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

export const register = asyncHandler(async (req, res) => {
  const result = await registerUser(req.body)
  return sendSuccess(res, result, 201, 'Registration successful.')
})

export const login = asyncHandler(async (req, res) => {
  const result = await loginUser(req.body)
  return sendSuccess(res, result, 200, 'Login successful.')
})

export const me = asyncHandler(async (req, res) => {
  const user = await getMe(req.user.id)
  return sendSuccess(res, { user })
})