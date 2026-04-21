import ExportLog from '../models/exportLogModel.js'
import Resume from '../models/resumeModel.js'
import ResumeMarkdownDocument from '../models/resumeMarkdownDocumentModel.js'

const ensureResumeOwnership = async (resumeId, userId) => {
  return Resume.findOne({ _id: resumeId, userId })
}

export const createExportLog = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const exportLog = await ExportLog.create({
      userId: req.user._id,
      resumeId: resume._id,
      format: req.body.format,
      templateId: req.body.templateId || resume.template?.theme || '',
      resumeVersionId: req.body.resumeVersionId || null,
      status: req.body.status || 'pending',
      metadata: req.body.metadata || {},
    })

    res.status(201).json(exportLog)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create export log', error: error.message })
  }
}

export const getResumeExportLogs = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const exportLogs = await ExportLog.find({ resumeId: resume._id, userId: req.user._id }).sort({ createdAt: -1 })
    res.json(exportLogs)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch export logs', error: error.message })
  }
}

export const exportResumeMarkdown = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const document = await ResumeMarkdownDocument.findOne({ resumeId: resume._id, userId: req.user._id })
    if (!document) {
      return res.status(200).json({
        status: 'not_ready',
        format: 'markdown',
        content: '',
        message: 'Markdown export is not ready for this resume yet',
      })
    }

    res.json({
      status: 'ready',
      format: 'markdown',
      content: document.content,
      title: document.title,
      resumeId: resume._id,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to export markdown', error: error.message })
  }
}
