import express from 'express'
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserPassword,
  updateUserProfile,
} from '../controllers/userController.js'
import { protect } from '../middleware/authMiddleware.js'


const userRouter = express.Router()

userRouter.post('/register', registerUser)
userRouter.post('/login', loginUser)

// protected route as token will be required
userRouter.get('/profile', protect, getUserProfile)
userRouter.put('/profile', protect, updateUserProfile)
userRouter.put('/password', protect, updateUserPassword)

export default userRouter
