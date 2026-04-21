import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { deriveResumeFromAts, getAtsAnalysisRecord, runAtsAnalysis } from '../controllers/atsController.js'

const router = express.Router()

router.post('/analyze', protect, runAtsAnalysis)
router.post('/derive-resume', protect, deriveResumeFromAts)
router.get('/records/:id', protect, getAtsAnalysisRecord)

export default router
