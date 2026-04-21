import ResumeImport from '../models/resumeImportModel.js'
import Resume from '../models/resumeModel.js'
import ResumeMarkdownDocument from '../models/resumeMarkdownDocumentModel.js'
import { parseMarkdownResume } from '../services/markdownImportService.js'
import { extractPdfText, mapPdfTextToResumeDraft } from '../services/pdfImportService.js'

const buildResumePayload = (resumeImport, overrides = {}) => {
  const draft = {
    ...(resumeImport.mappedResumeDraft || {}),
    ...(overrides.mappedResumeDraft || {}),
  }

  const freeBlocks = draft.freeBlocks || []

  return {
    title: draft.title || 'Imported Resume',
    profileInfo: draft.profileInfo || {},
    contactInfo: draft.contactInfo || {},
    workExperience: draft.workExperience || [],
    education: draft.education || [],
    skills: draft.skills || [],
    projects: draft.projects || [],
    certifications: draft.certifications || [],
    languages: draft.languages || [],
    interests: draft.interests || [],
    freeBlocks,
    contentSource: resumeImport.sourceType === 'markdown' ? 'markdown' : 'imported',
    sourceImportId: resumeImport._id,
    status: 'active',
  }
}

export const createResumeImport = async (req, res) => {
  try {
    const resumeImport = await ResumeImport.create({
      userId: req.user._id,
      sourceType: req.body.sourceType || 'manual',
      originalFileName: req.body.originalFileName || '',
      fileUrl: req.body.fileUrl || '',
      rawText: req.body.rawText || '',
      parsedSections: req.body.parsedSections || {},
      mappedResumeDraft: req.body.mappedResumeDraft || {},
      confidenceSummary: req.body.confidenceSummary || {},
      unresolvedFields: req.body.unresolvedFields || [],
      status: req.body.status || 'uploaded',
      failureReason: req.body.failureReason || '',
      manualCorrections: req.body.manualCorrections || [],
    })

    res.status(201).json(resumeImport)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create resume import', error: error.message })
  }
}

export const createMarkdownImport = async (req, res) => {
  try {
    const rawText = req.body.rawText || req.body.content || ''
    if (!rawText.trim()) {
      return res.status(400).json({ message: 'Markdown content is required' })
    }

    const parsed = parseMarkdownResume(rawText)

    const resumeImport = await ResumeImport.create({
      userId: req.user._id,
      sourceType: 'markdown',
      originalFileName: req.body.originalFileName || 'resume.md',
      rawText,
      parsedSections: parsed.parsedSections,
      mappedResumeDraft: parsed.mappedResumeDraft,
      confidenceSummary: parsed.confidenceSummary,
      unresolvedFields: parsed.unresolvedFields,
      status: 'needs_confirmation',
      manualCorrections: [],
    })

    res.status(201).json(resumeImport)
  } catch (error) {
    res.status(500).json({ message: 'Failed to import markdown', error: error.message })
  }
}

export const createPdfImport = async (req, res) => {
  try {
    const base64Content = req.body.base64Content || ''
    if (!base64Content.trim()) {
      return res.status(400).json({ message: 'PDF base64 content is required' })
    }

    try {
      const extracted = await extractPdfText(base64Content)
      const mapped = mapPdfTextToResumeDraft(extracted.rawText)

      const resumeImport = await ResumeImport.create({
        userId: req.user._id,
        sourceType: 'pdf',
        originalFileName: req.body.originalFileName || 'resume.pdf',
        rawText: extracted.rawText,
        parsedSections: {
          ...extracted.metadata,
          source: 'pdf',
        },
        mappedResumeDraft: mapped.mappedResumeDraft,
        confidenceSummary: mapped.confidenceSummary,
        unresolvedFields: mapped.unresolvedFields,
        status: 'needs_confirmation',
        manualCorrections: [],
      })

      return res.status(201).json(resumeImport)
    } catch (parseError) {
      const failedImport = await ResumeImport.create({
        userId: req.user._id,
        sourceType: 'pdf',
        originalFileName: req.body.originalFileName || 'resume.pdf',
        rawText: '',
        parsedSections: {},
        mappedResumeDraft: {},
        confidenceSummary: {},
        unresolvedFields: [],
        status: 'failed',
        failureReason: parseError.message || 'Failed to parse PDF',
        manualCorrections: [],
      })

      return res.status(422).json({
        message: 'Failed to parse PDF',
        failureReason: failedImport.failureReason,
        importId: failedImport._id,
      })
    }
  } catch (error) {
    res.status(500).json({ message: 'Failed to import PDF', error: error.message })
  }
}

export const getResumeImports = async (req, res) => {
  try {
    const imports = await ResumeImport.find({ userId: req.user._id }).sort({ createdAt: -1 })
    res.json(imports)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume imports', error: error.message })
  }
}

export const getResumeImportById = async (req, res) => {
  try {
    const resumeImport = await ResumeImport.findOne({ _id: req.params.id, userId: req.user._id })
    if (!resumeImport) {
      return res.status(404).json({ message: 'Resume import not found' })
    }

    res.json(resumeImport)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume import', error: error.message })
  }
}

export const updateResumeImport = async (req, res) => {
  try {
    const resumeImport = await ResumeImport.findOne({ _id: req.params.id, userId: req.user._id })
    if (!resumeImport) {
      return res.status(404).json({ message: 'Resume import not found' })
    }

    ;[
      'sourceType',
      'originalFileName',
      'fileUrl',
      'rawText',
      'parsedSections',
      'mappedResumeDraft',
      'confidenceSummary',
      'unresolvedFields',
      'status',
      'failureReason',
      'manualCorrections',
    ].forEach((field) => {
      if (req.body[field] !== undefined) {
        resumeImport[field] = req.body[field]
      }
    })

    const saved = await resumeImport.save()
    res.json(saved)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update resume import', error: error.message })
  }
}

export const confirmResumeImport = async (req, res) => {
  try {
    const resumeImport = await ResumeImport.findOne({ _id: req.params.id, userId: req.user._id })
    if (!resumeImport) {
      return res.status(404).json({ message: 'Resume import not found' })
    }

    if (resumeImport.status === 'confirmed' && resumeImport.confirmedResumeId) {
      return res.json({
        importId: resumeImport._id,
        resumeId: resumeImport.confirmedResumeId,
        markdownDocumentId: null,
        status: resumeImport.status,
      })
    }

    const resumePayload = buildResumePayload(resumeImport, req.body || {})
    const resume = await Resume.create({
      userId: req.user._id,
      ...resumePayload,
    })

    let markdownDocument = null
    if (resumeImport.sourceType === 'markdown') {
      markdownDocument = await ResumeMarkdownDocument.create({
        userId: req.user._id,
        resumeId: resume._id,
        title: `${resume.title} Markdown`,
        content: resumeImport.rawText,
        parsedStructuredSnapshot: resumePayload,
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      })

      resume.sourceDocumentId = markdownDocument._id
      await resume.save()
    }

    resumeImport.status = 'confirmed'
    resumeImport.confirmedResumeId = resume._id
    if (req.body.manualCorrections !== undefined) {
      resumeImport.manualCorrections = req.body.manualCorrections
    }
    if (req.body.mappedResumeDraft !== undefined) {
      resumeImport.mappedResumeDraft = req.body.mappedResumeDraft
    }
    await resumeImport.save()

    res.json({
      importId: resumeImport._id,
      resumeId: resume._id,
      markdownDocumentId: markdownDocument?._id || null,
      status: resumeImport.status,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to confirm resume import', error: error.message })
  }
}
