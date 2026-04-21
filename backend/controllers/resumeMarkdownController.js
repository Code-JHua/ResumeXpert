import Resume from '../models/resumeModel.js'
import ResumeMarkdownDocument from '../models/resumeMarkdownDocumentModel.js'
import { parseMarkdownResume } from '../services/markdownImportService.js'
import { buildMarkdownFromResume, buildStructuredSnapshot } from '../services/resumeMarkdownSyncService.js'

const ensureResumeOwnership = async (resumeId, userId) => {
  return Resume.findOne({ _id: resumeId, userId })
}

const buildMarkdownApplyPreview = (resume, parsed) => {
  const draft = parsed.mappedResumeDraft || {}
  const summary = []

  const compareText = (label, currentValue, nextValue) => {
    const currentText = currentValue || ''
    const nextText = nextValue || ''
    if (currentText !== nextText) {
      summary.push({
        field: label,
        currentValue: currentText,
        nextValue: nextText,
      })
    }
  }

  compareText('title', resume.title, draft.title || resume.title)
  compareText('profileInfo.fullName', resume.profileInfo?.fullName, draft.profileInfo?.fullName)
  compareText('profileInfo.designation', resume.profileInfo?.designation, draft.profileInfo?.designation)
  compareText('profileInfo.summary', resume.profileInfo?.summary, draft.profileInfo?.summary)
  compareText('contactInfo.email', resume.contactInfo?.email, draft.contactInfo?.email)
  compareText('contactInfo.phone', resume.contactInfo?.phone, draft.contactInfo?.phone)

  const compareCount = (label, currentItems = [], nextItems = []) => {
    if ((currentItems?.length || 0) !== (nextItems?.length || 0)) {
      summary.push({
        field: label,
        currentValue: `${currentItems?.length || 0} items`,
        nextValue: `${nextItems?.length || 0} items`,
      })
    }
  }

  compareCount('workExperience', resume.workExperience, draft.workExperience)
  compareCount('education', resume.education, draft.education)
  compareCount('skills', resume.skills, draft.skills)
  compareCount('projects', resume.projects, draft.projects)
  compareCount('freeBlocks', resume.freeBlocks, draft.freeBlocks)

  return summary
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

    if (document.syncStatus === 'synced' && !document.lastSyncedAt) {
      document.lastSyncedAt = new Date()
    }

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

export const syncMarkdownFromResume = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const generatedContent = buildMarkdownFromResume(resume)
    const snapshot = buildStructuredSnapshot(resume)
    const now = new Date()

    let document = await ResumeMarkdownDocument.findOne({ resumeId: resume._id, userId: req.user._id })

    if (!document) {
      document = await ResumeMarkdownDocument.create({
        userId: req.user._id,
        resumeId: resume._id,
        title: `${resume.title} Markdown`,
        content: generatedContent,
        parsedStructuredSnapshot: snapshot,
        syncStatus: 'synced',
        lastSyncedAt: now,
      })
    } else {
      document.title = req.body.title || document.title || `${resume.title} Markdown`
      document.content = generatedContent
      document.parsedStructuredSnapshot = snapshot
      document.syncStatus = 'synced'
      document.lastSyncedAt = now
      await document.save()
    }

    resume.sourceDocumentId = document._id
    if (resume.contentSource !== 'imported') {
      resume.contentSource = 'markdown'
    }
    await resume.save()

    res.json({
      content: generatedContent,
      document,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync markdown from resume', error: error.message })
  }
}

export const applyMarkdownToResume = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    let document = await ResumeMarkdownDocument.findOne({ resumeId: resume._id, userId: req.user._id })
    const content = req.body.content ?? document?.content ?? ''

    if (!content.trim()) {
      return res.status(400).json({ message: 'Markdown content is required' })
    }

    const parsed = parseMarkdownResume(content)

    resume.title = parsed.mappedResumeDraft.title || resume.title
    resume.profileInfo = { ...resume.profileInfo, ...(parsed.mappedResumeDraft.profileInfo || {}) }
    resume.contactInfo = { ...resume.contactInfo, ...(parsed.mappedResumeDraft.contactInfo || {}) }
    resume.workExperience = parsed.mappedResumeDraft.workExperience || []
    resume.education = parsed.mappedResumeDraft.education || []
    resume.skills = parsed.mappedResumeDraft.skills || []
    resume.projects = parsed.mappedResumeDraft.projects || []
    resume.certifications = parsed.mappedResumeDraft.certifications || []
    resume.languages = parsed.mappedResumeDraft.languages || []
    resume.interests = parsed.mappedResumeDraft.interests || []
    resume.freeBlocks = parsed.mappedResumeDraft.freeBlocks || []
    if (resume.contentSource !== 'imported') {
      resume.contentSource = 'markdown'
    }
    await resume.save()

    const now = new Date()
    if (!document) {
      document = await ResumeMarkdownDocument.create({
        userId: req.user._id,
        resumeId: resume._id,
        title: req.body.title || `${resume.title} Markdown`,
        content,
        parsedStructuredSnapshot: buildStructuredSnapshot(resume),
        syncStatus: 'synced',
        lastSyncedAt: now,
      })
    } else {
      document.title = req.body.title || document.title || `${resume.title} Markdown`
      document.content = content
      document.parsedStructuredSnapshot = buildStructuredSnapshot(resume)
      document.syncStatus = 'synced'
      document.lastSyncedAt = now
      await document.save()
    }

    resume.sourceDocumentId = document._id
    await resume.save()

    res.json({
      resume,
      document,
      parsedSections: parsed.parsedSections,
      unresolvedFields: parsed.unresolvedFields,
      confidenceSummary: parsed.confidenceSummary,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to apply markdown to resume', error: error.message })
  }
}

export const previewApplyMarkdownToResume = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const document = await ResumeMarkdownDocument.findOne({ resumeId: resume._id, userId: req.user._id })
    const content = req.body.content ?? document?.content ?? ''

    if (!content.trim()) {
      return res.status(400).json({ message: 'Markdown content is required' })
    }

    const parsed = parseMarkdownResume(content)
    const overwriteSummary = buildMarkdownApplyPreview(resume, parsed)

    res.json({
      overwriteSummary,
      parsedSections: parsed.parsedSections,
      unresolvedFields: parsed.unresolvedFields,
      confidenceSummary: parsed.confidenceSummary,
      mappedResumeDraft: parsed.mappedResumeDraft,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to preview markdown apply', error: error.message })
  }
}
