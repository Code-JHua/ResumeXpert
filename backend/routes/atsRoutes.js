import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { runAtsAnalysis } from '../controllers/atsController.js'

const router = express.Router()

router.post('/analyze', protect, runAtsAnalysis)

export default router
