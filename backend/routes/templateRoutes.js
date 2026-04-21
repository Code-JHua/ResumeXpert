import express from 'express'
import { getTemplatePreview, getTemplates } from '../controllers/templateController.js'

const templateRoutes = express.Router()

templateRoutes.get('/', getTemplates)
templateRoutes.get('/:id/preview', getTemplatePreview)

export default templateRoutes
