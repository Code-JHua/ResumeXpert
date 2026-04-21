import CoverLetter from '../models/coverLetterModel.js'
import JobDescription from '../models/jobDescriptionModel.js'
import Resume from '../models/resumeModel.js'
import { analyzeResumeAgainstJob, buildAiEnhancement, generateCoverLetterContent } from '../services/atsService.js'

export const createCoverLetter = async (req, res) => {
  try {
    const coverLetter = await CoverLetter.create({
      userId: req.user._id,
      resumeId: req.body.resumeId || null,
      jobDescriptionId: req.body.jobDescriptionId || null,
      title: req.body.title || '未命名求职信',
      content: req.body.content || '',
      generationMode: req.body.generationMode || 'manual',
    })

    res.status(201).json(coverLetter)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create cover letter', error: error.message })
  }
}

export const generateCoverLetter = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId, title } = req.body
    const [resume, jobDescription] = await Promise.all([
      Resume.findOne({ _id: resumeId, userId: req.user._id }),
      jobDescriptionId ? JobDescription.findOne({ _id: jobDescriptionId, userId: req.user._id }) : null,
    ])

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const analysis = jobDescription ? analyzeResumeAgainstJob(resume, jobDescription) : {
      matchedKeywords: [],
      missingKeywords: [],
      recommendations: [],
    }

    const aiEnhancement = buildAiEnhancement({ analysis, resume, jobDescription: jobDescription || { title: '', company: '' } })
    const coverLetter = await CoverLetter.create({
      userId: req.user._id,
      resumeId,
      jobDescriptionId: jobDescriptionId || null,
      title: title || `${resume.title} 求职信`,
      content: generateCoverLetterContent({ resume, jobDescription, analysis }),
      generationMode: aiEnhancement ? 'ai-enhanced' : 'template',
    })

    res.status(201).json({
      ...coverLetter.toObject(),
      analysis,
      aiEnhancement,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate cover letter', error: error.message })
  }
}

export const getCoverLetters = async (req, res) => {
  try {
    const coverLetters = await CoverLetter.find({ userId: req.user._id }).sort({ updatedAt: -1 })
    res.json(coverLetters)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cover letters', error: error.message })
  }
}

export const getCoverLetterById = async (req, res) => {
  try {
    const coverLetter = await CoverLetter.findOne({ _id: req.params.id, userId: req.user._id })
    if (!coverLetter) {
      return res.status(404).json({ message: 'Cover letter not found' })
    }
    res.json(coverLetter)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch cover letter', error: error.message })
  }
}

export const updateCoverLetter = async (req, res) => {
  try {
    const coverLetter = await CoverLetter.findOne({ _id: req.params.id, userId: req.user._id })
    if (!coverLetter) {
      return res.status(404).json({ message: 'Cover letter not found' })
    }

    ;['title', 'content', 'resumeId', 'jobDescriptionId'].forEach((field) => {
      if (req.body[field] !== undefined) {
        coverLetter[field] = req.body[field]
      }
    })

    if (req.body.generationMode) {
      coverLetter.generationMode = req.body.generationMode
    }

    const saved = await coverLetter.save()
    res.json(saved)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update cover letter', error: error.message })
  }
}

export const deleteCoverLetter = async (req, res) => {
  try {
    const coverLetter = await CoverLetter.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!coverLetter) {
      return res.status(404).json({ message: 'Cover letter not found' })
    }
    res.json({ message: 'Cover letter deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete cover letter', error: error.message })
  }
}
