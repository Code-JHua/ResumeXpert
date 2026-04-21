import JobDescription from '../models/jobDescriptionModel.js'
import { extractKeywordsFromText } from '../services/atsService.js'

const shapePayload = (body = {}) => {
  const keywordData = extractKeywordsFromText(body.sourceText || '')

  return {
    title: body.title,
    company: body.company || '',
    sourceText: body.sourceText || '',
    keywords: body.keywords?.length ? body.keywords : keywordData.keywords,
    skillKeywords: body.skillKeywords?.length ? body.skillKeywords : keywordData.skillKeywords,
    educationKeywords: body.educationKeywords?.length ? body.educationKeywords : keywordData.educationKeywords,
    experienceKeywords: body.experienceKeywords?.length ? body.experienceKeywords : keywordData.experienceKeywords,
  }
}

export const createJobDescription = async (req, res) => {
  try {
    const payload = shapePayload(req.body)
    const jobDescription = await JobDescription.create({
      userId: req.user._id,
      ...payload,
    })
    res.status(201).json(jobDescription)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create job description', error: error.message })
  }
}

export const getJobDescriptions = async (req, res) => {
  try {
    const jobs = await JobDescription.find({ userId: req.user._id }).sort({ updatedAt: -1 })
    res.json(jobs)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job descriptions', error: error.message })
  }
}

export const getJobDescriptionById = async (req, res) => {
  try {
    const jobDescription = await JobDescription.findOne({ _id: req.params.id, userId: req.user._id })
    if (!jobDescription) {
      return res.status(404).json({ message: 'Job description not found' })
    }
    res.json(jobDescription)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch job description', error: error.message })
  }
}

export const updateJobDescription = async (req, res) => {
  try {
    const jobDescription = await JobDescription.findOne({ _id: req.params.id, userId: req.user._id })
    if (!jobDescription) {
      return res.status(404).json({ message: 'Job description not found' })
    }

    Object.assign(jobDescription, shapePayload({ ...jobDescription.toObject(), ...req.body }))
    const saved = await jobDescription.save()
    res.json(saved)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update job description', error: error.message })
  }
}

export const deleteJobDescription = async (req, res) => {
  try {
    const jobDescription = await JobDescription.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!jobDescription) {
      return res.status(404).json({ message: 'Job description not found' })
    }
    res.json({ message: 'Job description deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete job description', error: error.message })
  }
}
