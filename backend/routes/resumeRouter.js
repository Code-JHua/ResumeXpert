import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { createResume, getUserResumes, getResumeById, updateResume, deleteResume } from '../controllers/resumeController.js'
import { uploadResumeImage } from '../controllers/uploadImages.js'
import upload from '../middleware/uploadMiddleware.js'
import {
  createResumeVersion,
  deleteResumeVersion,
  getResumeVersionById,
  getResumeVersions,
  restoreResumeVersion,
} from '../controllers/resumeVersionController.js'
import {
  applyMarkdownToResume,
  createResumeMarkdownDocument,
  deleteResumeMarkdownDocument,
  getResumeMarkdownDocument,
  previewApplyMarkdownToResume,
  syncMarkdownFromResume,
  updateResumeMarkdownDocument,
} from '../controllers/resumeMarkdownController.js'
import {
  createExportLog,
  createResumeSharePage,
  exportResumeDocx,
  exportResumeMarkdown,
  getResumeExportLogs,
  getResumeSharePage,
  toggleResumeSharePage,
  updateResumeSharePage,
} from '../controllers/exportController.js'


const resumeRouter = express.Router()
resumeRouter.post('/', protect, createResume)
resumeRouter.get('/', protect, getUserResumes)
resumeRouter.get('/:id', protect, getResumeById)
resumeRouter.get('/:id/markdown', protect, getResumeMarkdownDocument)
resumeRouter.post('/:id/markdown', protect, createResumeMarkdownDocument)
resumeRouter.put('/:id/markdown', protect, updateResumeMarkdownDocument)
resumeRouter.post('/:id/markdown/sync-from-resume', protect, syncMarkdownFromResume)
resumeRouter.post('/:id/markdown/preview-apply', protect, previewApplyMarkdownToResume)
resumeRouter.post('/:id/markdown/apply-to-resume', protect, applyMarkdownToResume)
resumeRouter.delete('/:id/markdown', protect, deleteResumeMarkdownDocument)
resumeRouter.get('/:id/export/markdown', protect, exportResumeMarkdown)
resumeRouter.get('/:id/export/docx', protect, exportResumeDocx)
resumeRouter.post('/:id/exports/log', protect, createExportLog)
resumeRouter.get('/:id/exports', protect, getResumeExportLogs)
resumeRouter.post('/:id/share', protect, createResumeSharePage)
resumeRouter.get('/:id/share', protect, getResumeSharePage)
resumeRouter.put('/:id/share', protect, updateResumeSharePage)
resumeRouter.post('/:id/share/toggle', protect, toggleResumeSharePage)

resumeRouter.put('/:id', protect, updateResume)
resumeRouter.put('/:id/upload-image', protect, upload.fields([{ name: "thumbnail" }, { name: "profileImage" }]), uploadResumeImage)
resumeRouter.post('/:id/versions', protect, createResumeVersion)
resumeRouter.get('/:id/versions', protect, getResumeVersions)
resumeRouter.get('/:id/versions/:versionId', protect, getResumeVersionById)
resumeRouter.post('/:id/versions/:versionId/restore', protect, restoreResumeVersion)
resumeRouter.delete('/:id/versions/:versionId', protect, deleteResumeVersion)

resumeRouter.delete('/:id', protect, deleteResume)

export default resumeRouter
