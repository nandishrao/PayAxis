import { Router } from 'express'
import { register, login, me } from '../controllers/authController.js'
import { authenticate } from '../middlewares/authenticate.js'
import { validate, registerSchema, loginSchema } from '../utils/validators.js'

const router = Router()

// POST /api/auth/register
router.post('/register', validate(registerSchema), register)

// POST /api/auth/login
router.post('/login', validate(loginSchema), login)

// GET /api/auth/me  (protected)
router.get('/me', authenticate, me)

export default router