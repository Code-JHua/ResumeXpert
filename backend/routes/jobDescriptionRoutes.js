import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  createJobDescription,
  deleteJobDescription,
  getJobDescriptionById,
  getJobDescriptions,
  updateJobDescription,
} from '../controllers/jobDescriptionController.js'

const router = express.Router()

router.post('/', protect, createJobDescription)
router.get('/', protect, getJobDescriptions)
router.get('/:id', protect, getJobDescriptionById)
router.put('/:id', protect, updateJobDescription)
router.delete('/:id', protect, deleteJobDescription)

export default router
