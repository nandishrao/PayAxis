import { sendError } from '../utils/response.js'

// Async wrapper — eliminates try/catch boilerplate in every controller
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Global error handler — must be registered last in Express
export const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, {
    stack:  process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path:   req.path,
    method: req.method,
  })

  // Prisma known errors
  if (err.code === 'P2002') {
    return sendError(res, 'A record with this value already exists.', 409)
  }
  if (err.code === 'P2025') {
    return sendError(res, 'Record not found.', 404)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token.', 401)
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired.', 401)
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    return sendError(res, 'Validation failed.', 422, err.errors)
  }

  // App-level errors with explicit status
  if (err.statusCode) {
    return sendError(res, err.message, err.statusCode)
  }

  return sendError(res, 'Internal server error.', 500)
}

// Convenience: throw structured errors from services
export const createError = (message, statusCode = 400) => {
  const err = new Error(message)
  err.statusCode = statusCode
  return err
}