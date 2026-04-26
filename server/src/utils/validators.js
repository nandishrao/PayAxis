import { z } from 'zod'

// ── Auth ──────────────────────────────────────

export const registerSchema = z.object({
  email:     z.string().email('Invalid email address.'),
  password:  z.string().min(8, 'Password must be at least 8 characters.'),
  firstName: z.string().min(1, 'First name is required.'),
  lastName:  z.string().min(1, 'Last name is required.'),
})

export const loginSchema = z.object({
  email:    z.string().email('Invalid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

// ── Organisation ──────────────────────────────

export const createOrgSchema = z.object({
  name: z.string().min(1, 'Organisation name is required.'),
  type: z.enum(['AGENCY', 'UMBRELLA'], { errorMap: () => ({ message: 'Type must be AGENCY or UMBRELLA.' }) }),
})

export const addMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID.'),
  role:   z.enum([
    'AGENCY_ADMIN',
    'AGENCY_CONSULTANT',
    'UMBRELLA_ADMIN',
    'PAYROLL_OPERATOR',
    'CONTRACTOR',
  ]),
})

export const linkContractorSchema = z.object({
  contractorId:      z.string().uuid('Invalid contractor ID.'),
  agencyId:          z.string().uuid('Invalid agency ID.'),
  umbrellaId:        z.string().uuid('Invalid umbrella ID.'),
  agreedRatePerHour: z.number().positive('Rate must be a positive number.'),
  currency:          z.string().length(3, 'Currency must be a 3-letter code.').default('GBP'),
})

// ── Middleware helper ─────────────────────────

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed.',
      errors:  result.error.errors.map((e) => ({
        field:   e.path.join('.'),
        message: e.message,
      })),
    })
  }
  req.body = result.data
  next()
}