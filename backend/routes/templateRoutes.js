import express from 'express'
import { optionalProtect, protect, requireAdmin } from '../middleware/authMiddleware.js'
import {
  applyTemplateToResume,
  createTemplate,
  deleteTemplate,
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

templateRoutes.get('/', optionalProtect, getTemplates)
templateRoutes.get('/review-queue', protect, requireAdmin, getTemplateReviewQueue)
templateRoutes.get('/:id', optionalProtect, getTemplateById)
templateRoutes.get('/:id/preview', optionalProtect, getTemplateById)
templateRoutes.post('/', protect, createTemplate)
templateRoutes.put('/:id', protect, updateTemplate)
templateRoutes.delete('/:id', protect, deleteTemplate)
templateRoutes.post('/:id/favorite', protect, toggleFavoriteTemplate)
templateRoutes.post('/:id/duplicate', protect, duplicateTemplate)
templateRoutes.post('/:id/apply', protect, applyTemplateToResume)
templateRoutes.post('/:id/submit-community', protect, submitTemplateToCommunity)
templateRoutes.post('/:id/review', protect, requireAdmin, reviewTemplateSubmission)

export default templateRoutes
