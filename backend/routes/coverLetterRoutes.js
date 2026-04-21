import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  createCoverLetter,
  deleteCoverLetter,
  generateCoverLetter,
  getCoverLetterById,
  getCoverLetters,
  updateCoverLetter,
} from '../controllers/coverLetterController.js'

const router = express.Router()

router.post('/', protect, createCoverLetter)
router.post('/generate', protect, generateCoverLetter)
router.get('/', protect, getCoverLetters)
router.get('/:id', protect, getCoverLetterById)
router.put('/:id', protect, updateCoverLetter)
router.delete('/:id', protect, deleteCoverLetter)

export default router
