import { Router } from 'express'
import { myNotifications } from '../controllers/notificationController.js'
import { authenticate } from '../middlewares/authenticate.js'

const router = Router()
router.use(authenticate)

// GET /api/notifications/me
router.get('/me', myNotifications)

export default router