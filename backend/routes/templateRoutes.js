import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  applyTemplateToResume,
  createTemplate,
  duplicateTemplate,
  getTemplateById,
  getTemplateReviewQueue,
  getTemplates,
  reviewTemplateSubmission,
  submitTemplateToCommunity,
  toggleFavoriteTemplate,
  updateTemplate,
} from '../controllers/templateController.js'

const templateRoutes = express.Router()

templateRoutes.get('/', protect, getTemplates)
templateRoutes.get('/review-queue', protect, getTemplateReviewQueue)
templateRoutes.get('/:id', protect, getTemplateById)
templateRoutes.get('/:id/preview', protect, getTemplateById)
templateRoutes.post('/', protect, createTemplate)
templateRoutes.put('/:id', protect, updateTemplate)
templateRoutes.post('/:id/favorite', protect, toggleFavoriteTemplate)
templateRoutes.post('/:id/duplicate', protect, duplicateTemplate)
templateRoutes.post('/:id/apply', protect, applyTemplateToResume)
templateRoutes.post('/:id/submit-community', protect, submitTemplateToCommunity)
templateRoutes.post('/:id/review', protect, reviewTemplateSubmission)

export default templateRoutes
