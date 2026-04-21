import JobDescription from '../models/jobDescriptionModel.js'
import Resume from '../models/resumeModel.js'
import { analyzeResumeAgainstJob, buildAiEnhancement } from '../services/atsService.js'

export const runAtsAnalysis = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId } = req.body

    const [resume, jobDescription] = await Promise.all([
      Resume.findOne({ _id: resumeId, userId: req.user._id }),
      JobDescription.findOne({ _id: jobDescriptionId, userId: req.user._id }),
    ])

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    if (!jobDescription) {
      return res.status(404).json({ message: 'Job description not found' })
    }

    const analysis = analyzeResumeAgainstJob(resume, jobDescription)
    analysis.aiEnhancement = buildAiEnhancement({ analysis, resume, jobDescription })

    res.json({
      resumeId,
      jobDescriptionId,
      ...analysis,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to run ATS analysis', error: error.message })
  }
}
