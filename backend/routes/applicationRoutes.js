import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  addApplicationTimelineItem,
  createApplication,
  deleteApplication,
  getApplicationById,
  getApplications,
  getApplicationStats,
  updateApplication,
} from '../controllers/applicationController.js'

const router = express.Router()

router.post('/', protect, createApplication)
router.get('/', protect, getApplications)
router.get('/stats/summary', protect, getApplicationStats)
router.get('/:id', protect, getApplicationById)
router.put('/:id', protect, updateApplication)
router.post('/:id/timeline', protect, addApplicationTimelineItem)
router.delete('/:id', protect, deleteApplication)

export default router
