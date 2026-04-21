import Resume from '../models/resumeModel.js'
import ResumeMarkdownDocument from '../models/resumeMarkdownDocumentModel.js'

const ensureResumeOwnership = async (resumeId, userId) => {
  return Resume.findOne({ _id: resumeId, userId })
}

export const createResumeMarkdownDocument = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const existing = await ResumeMarkdownDocument.findOne({ resumeId: resume._id, userId: req.user._id })
    if (existing) {
      return res.status(409).json({ message: 'Markdown document already exists for this resume' })
    }

    const document = await ResumeMarkdownDocument.create({
      userId: req.user._id,
      resumeId: resume._id,
      title: req.body.title || `${resume.title} Markdown`,
      content: req.body.content || '',
      parsedStructuredSnapshot: req.body.parsedStructuredSnapshot || {},
      syncStatus: req.body.syncStatus || 'not_synced',
      lastSyncedAt: req.body.lastSyncedAt || null,
    })

    resume.sourceDocumentId = document._id
    if (resume.contentSource === 'structured' && document.content) {
      resume.contentSource = 'markdown'
    }
    await resume.save()

    res.status(201).json(document)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create markdown document', error: error.message })
  }
}

export const getResumeMarkdownDocument = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const document = await ResumeMarkdownDocument.findOne({ resumeId: resume._id, userId: req.user._id })
    if (!document) {
      return res.status(404).json({ message: 'Markdown document not found' })
    }

    res.json(document)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch markdown document', error: error.message })
  }
}

export const updateResumeMarkdownDocument = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const document = await ResumeMarkdownDocument.findOne({ resumeId: resume._id, userId: req.user._id })
    if (!document) {
      return res.status(404).json({ message: 'Markdown document not found' })
    }

    ;['title', 'content', 'parsedStructuredSnapshot', 'syncStatus', 'lastSyncedAt'].forEach((field) => {
      if (req.body[field] !== undefined) {
        document[field] = req.body[field]
      }
    })

    const saved = await document.save()

    if (resume.sourceDocumentId?.toString() !== saved._id.toString()) {
      resume.sourceDocumentId = saved._id
    }
    if (req.body.content !== undefined && resume.contentSource !== 'imported') {
      resume.contentSource = 'markdown'
    }
    await resume.save()

    res.json(saved)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update markdown document', error: error.message })
  }
}

export const deleteResumeMarkdownDocument = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const document = await ResumeMarkdownDocument.findOneAndDelete({ resumeId: resume._id, userId: req.user._id })
    if (!document) {
      return res.status(404).json({ message: 'Markdown document not found' })
    }

    if (resume.sourceDocumentId?.toString() === document._id.toString()) {
      resume.sourceDocumentId = null
      if (resume.contentSource === 'markdown') {
        resume.contentSource = 'structured'
      }
      await resume.save()
    }

    res.json({ message: 'Markdown document deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete markdown document', error: error.message })
  }
}
