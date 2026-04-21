import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import {
  confirmResumeImport,
  createResumeImport,
  createDocxImport,
  createMarkdownImport,
  createPdfImport,
  getResumeImports,
  getResumeImportById,
  updateResumeImport,
} from '../controllers/resumeImportController.js'

const resumeImportRoutes = express.Router()

resumeImportRoutes.get('/', protect, getResumeImports)
resumeImportRoutes.post('/', protect, createResumeImport)
resumeImportRoutes.post('/markdown', protect, createMarkdownImport)
resumeImportRoutes.post('/pdf', protect, createPdfImport)
resumeImportRoutes.post('/docx', protect, createDocxImport)
resumeImportRoutes.get('/:id', protect, getResumeImportById)
resumeImportRoutes.put('/:id', protect, updateResumeImport)
resumeImportRoutes.put('/:id/confirm', protect, confirmResumeImport)

export default resumeImportRoutes
