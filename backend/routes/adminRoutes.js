import express from 'express'
import {
  getAdminUserById,
  getAdminUsers,
  resetAdminUserPassword,
  updateAdminUserStatus,
} from '../controllers/adminController.js'
import { protect, requireAdmin } from '../middleware/authMiddleware.js'

const adminRoutes = express.Router()

adminRoutes.use(protect, requireAdmin)

adminRoutes.get('/users', getAdminUsers)
adminRoutes.get('/users/:id', getAdminUserById)
adminRoutes.put('/users/:id/status', updateAdminUserStatus)
adminRoutes.post('/users/:id/password-reset', resetAdminUserPassword)

export default adminRoutes
