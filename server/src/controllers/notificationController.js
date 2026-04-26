import { getMyNotifications } from '../services/notificationService.js'
import { sendSuccess } from '../utils/response.js'
import { asyncHandler } from '../middlewares/errorHandler.js'

export const myNotifications = asyncHandler(async (req, res) => {
  const unreadOnly    = req.query.unreadOnly === 'true'
  const notifications = await getMyNotifications(req.user.id, { unreadOnly })
  return sendSuccess(res, { notifications, count: notifications.length })
})