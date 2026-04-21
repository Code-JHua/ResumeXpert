import ExportLog from '../models/exportLogModel.js'
import Resume from '../models/resumeModel.js'
import ResumeMarkdownDocument from '../models/resumeMarkdownDocumentModel.js'
import SharedResumePage from '../models/sharedResumePageModel.js'
import crypto from 'crypto'
import { buildResumeDocxBuffer } from '../services/docxExportService.js'

const ensureResumeOwnership = async (resumeId, userId) => {
  return Resume.findOne({ _id: resumeId, userId })
}

const buildPublicUrl = (req, slug) => {
  return `${req.protocol}://${req.get('host')}/s/${slug}`
}

const buildShareSnapshot = (resume) => ({
  title: resume.title,
  template: resume.template || { theme: '01', colorPalette: [] },
  contentSource: resume.contentSource,
  profileInfo: resume.profileInfo || {},
  contactInfo: resume.contactInfo || {},
  workExperience: resume.workExperience || [],
  education: resume.education || [],
  skills: resume.skills || [],
  projects: resume.projects || [],
  certifications: resume.certifications || [],
  languages: resume.languages || [],
  interests: resume.interests || [],
  freeBlocks: resume.freeBlocks || [],
})

const buildShareResponse = (req, sharePage) => ({
  id: sharePage._id,
  resumeId: sharePage.resumeId,
  slug: sharePage.slug,
  publicUrl: buildPublicUrl(req, sharePage.slug),
  title: sharePage.title,
  status: sharePage.status,
  isEnabled: sharePage.isEnabled,
  visibility: sharePage.visibility,
  lastPublishedAt: sharePage.lastPublishedAt,
  lastViewedAt: sharePage.lastViewedAt,
  viewCount: sharePage.viewCount,
  uniqueVisitorCount: sharePage.uniqueVisitorCount,
  createdAt: sharePage.createdAt,
  updatedAt: sharePage.updatedAt,
})

const generateShareSlug = async (title) => {
  const baseTitle = String(title || 'resume')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 32) || 'resume'

  let slug = `${baseTitle}-${crypto.randomBytes(3).toString('hex')}`
  let exists = await SharedResumePage.exists({ slug })

  while (exists) {
    slug = `${baseTitle}-${crypto.randomBytes(3).toString('hex')}`
    exists = await SharedResumePage.exists({ slug })
  }

  return slug
}

const buildVisitorHash = (req) => {
  const raw = `${req.ip || 'unknown'}|${req.get('user-agent') || 'unknown'}`
  return crypto.createHash('sha1').update(raw).digest('hex')
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
      metadata: {
        triggerSource: req.body.triggerSource || 'unknown',
        fileName: req.body.fileName || '',
        errorMessage: req.body.errorMessage || '',
        exportDurationMs: req.body.exportDurationMs || null,
        sharePageId: req.body.sharePageId || null,
        ...(req.body.metadata || {}),
      },
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

export const exportResumeDocx = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const buffer = await buildResumeDocxBuffer(resume)
    const fileName = `${String(resume.title || 'resume').replace(/[^a-z0-9]/gi, '_')}.docx`

    await ExportLog.create({
      userId: req.user._id,
      resumeId: resume._id,
      format: 'docx',
      templateId: resume.template?.theme || '',
      status: 'success',
      metadata: {
        triggerSource: req.query.triggerSource || 'output_center',
        fileName,
      },
    })

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`)
    res.send(buffer)
  } catch (error) {
    res.status(500).json({ message: 'Failed to export DOCX', error: error.message })
  }
}

export const getResumeSharePage = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const sharePage = await SharedResumePage.findOne({ resumeId: resume._id, userId: req.user._id })
    if (!sharePage) {
      return res.status(404).json({ message: 'Share page not found' })
    }

    res.json(buildShareResponse(req, sharePage))
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch share page', error: error.message })
  }
}

export const createResumeSharePage = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const existingSharePage = await SharedResumePage.findOne({ resumeId: resume._id, userId: req.user._id })
    if (existingSharePage) {
      return res.json(buildShareResponse(req, existingSharePage))
    }

    const snapshot = buildShareSnapshot(resume)
    const sharePage = await SharedResumePage.create({
      userId: req.user._id,
      resumeId: resume._id,
      resumeVersionId: req.body.resumeVersionId || null,
      slug: await generateShareSlug(resume.title),
      title: req.body.title || resume.title,
      status: 'published',
      isEnabled: true,
      visibility: 'public',
      lastPublishedAt: new Date(),
      lastSnapshot: snapshot,
      themeSnapshot: resume.template || { theme: '01', colorPalette: [] },
    })

    await ExportLog.create({
      userId: req.user._id,
      resumeId: resume._id,
      format: 'share',
      templateId: resume.template?.theme || '',
      resumeVersionId: sharePage.resumeVersionId,
      status: 'success',
      metadata: {
        triggerSource: req.body.triggerSource || 'share_management',
        sharePageId: sharePage._id,
        action: 'create',
      },
    })

    res.status(201).json(buildShareResponse(req, sharePage))
  } catch (error) {
    res.status(500).json({ message: 'Failed to create share page', error: error.message })
  }
}

export const updateResumeSharePage = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const sharePage = await SharedResumePage.findOne({ resumeId: resume._id, userId: req.user._id })
    if (!sharePage) {
      return res.status(404).json({ message: 'Share page not found' })
    }

    sharePage.title = req.body.title || resume.title
    sharePage.resumeVersionId = req.body.resumeVersionId || sharePage.resumeVersionId
    sharePage.status = 'published'
    sharePage.isEnabled = true
    sharePage.lastPublishedAt = new Date()
    sharePage.lastSnapshot = buildShareSnapshot(resume)
    sharePage.themeSnapshot = resume.template || { theme: '01', colorPalette: [] }

    await sharePage.save()

    await ExportLog.create({
      userId: req.user._id,
      resumeId: resume._id,
      format: 'share',
      templateId: resume.template?.theme || '',
      resumeVersionId: sharePage.resumeVersionId,
      status: 'success',
      metadata: {
        triggerSource: req.body.triggerSource || 'share_management',
        sharePageId: sharePage._id,
        action: 'publish',
      },
    })

    res.json(buildShareResponse(req, sharePage))
  } catch (error) {
    res.status(500).json({ message: 'Failed to update share page', error: error.message })
  }
}

export const toggleResumeSharePage = async (req, res) => {
  try {
    const resume = await ensureResumeOwnership(req.params.id, req.user._id)
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const sharePage = await SharedResumePage.findOne({ resumeId: resume._id, userId: req.user._id })
    if (!sharePage) {
      return res.status(404).json({ message: 'Share page not found' })
    }

    const nextEnabled = typeof req.body.isEnabled === 'boolean' ? req.body.isEnabled : !sharePage.isEnabled
    sharePage.isEnabled = nextEnabled
    sharePage.status = nextEnabled ? 'published' : 'disabled'

    if (nextEnabled) {
      sharePage.lastPublishedAt = new Date()
      sharePage.lastSnapshot = buildShareSnapshot(resume)
      sharePage.themeSnapshot = resume.template || { theme: '01', colorPalette: [] }
    }

    await sharePage.save()

    await ExportLog.create({
      userId: req.user._id,
      resumeId: resume._id,
      format: 'share',
      templateId: resume.template?.theme || '',
      resumeVersionId: sharePage.resumeVersionId,
      status: 'success',
      metadata: {
        triggerSource: req.body.triggerSource || 'share_management',
        sharePageId: sharePage._id,
        action: nextEnabled ? 'enable' : 'disable',
      },
    })

    res.json(buildShareResponse(req, sharePage))
  } catch (error) {
    res.status(500).json({ message: 'Failed to toggle share page', error: error.message })
  }
}

export const getPublicSharePage = async (req, res) => {
  try {
    const sharePage = await SharedResumePage.findOne({ slug: req.params.slug }).select('+visitorHashes')
    if (!sharePage || !sharePage.isEnabled || sharePage.status !== 'published') {
      return res.status(404).json({ message: 'Shared resume not found' })
    }

    const visitorHash = buildVisitorHash(req)
    const hasVisited = sharePage.visitorHashes.includes(visitorHash)

    sharePage.viewCount += 1
    sharePage.lastViewedAt = new Date()

    if (!hasVisited) {
      sharePage.visitorHashes.push(visitorHash)
      sharePage.uniqueVisitorCount += 1
    }

    await sharePage.save()

    res.json({
      slug: sharePage.slug,
      title: sharePage.title,
      status: sharePage.status,
      lastPublishedAt: sharePage.lastPublishedAt,
      viewCount: sharePage.viewCount,
      uniqueVisitorCount: sharePage.uniqueVisitorCount,
      resume: sharePage.lastSnapshot,
      themeSnapshot: sharePage.themeSnapshot,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to load shared resume', error: error.message })
  }
}
