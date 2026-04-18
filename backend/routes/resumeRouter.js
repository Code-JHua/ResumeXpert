import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { createResume, getUserResumes, getResumeById, updateResume, deleteResume } from '../controllers/resumeController.js'
import { uploadResumeImage } from '../controllers/uploadImages.js'
import upload from '../middleware/uploadMiddleware.js'


const resumeRouter = express.Router()
resumeRouter.post('/', protect, createResume)
resumeRouter.get('/', protect, getUserResumes)
resumeRouter.get('/:id', protect, getResumeById)

resumeRouter.put('/:id', protect, updateResume)
resumeRouter.put('/:id/upload-image', protect, upload.fields([{ name: "thumbnail" }, { name: "profileImage" }]), uploadResumeImage)

resumeRouter.delete('/:id', protect, deleteResume)

export default resumeRouter