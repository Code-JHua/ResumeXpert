import JobDescription from '../models/jobDescriptionModel.js'
import Resume from '../models/resumeModel.js'
import ResumeVersion from '../models/resumeVersionModel.js'
import AtsAnalysisRecord from '../models/atsAnalysisRecordModel.js'
import { analyzeResumeAgainstJob, buildAiEnhancement } from '../services/atsService.js'

const buildResumeSnapshot = (resume) => {
  const plainResume = resume.toObject ? resume.toObject() : resume
  const { _id, createdAt, updatedAt, __v, ...snapshot } = plainResume
  return snapshot
}

export const runAtsAnalysis = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId, resumeVersionId } = req.body

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

    const analysisRecord = await AtsAnalysisRecord.create({
      userId: req.user._id,
      resumeId,
      resumeVersionId: resumeVersionId || null,
      jobDescriptionId,
      overallScore: analysis.overallScore,
      matchedKeywords: analysis.matchedKeywords || [],
      missingKeywords: analysis.missingKeywords || [],
      recommendations: analysis.recommendations || [],
      recommendedSections: analysis.recommendedSections || [],
      aiEnhancement: analysis.aiEnhancement,
      breakdown: analysis.breakdown || {},
    })

    res.json({
      analysisRecordId: analysisRecord._id,
      resumeId,
      jobDescriptionId,
      ...analysis,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to run ATS analysis', error: error.message })
  }
}

export const getAtsAnalysisRecord = async (req, res) => {
  try {
    const record = await AtsAnalysisRecord.findOne({
      _id: req.params.id,
      userId: req.user._id,
    })

    if (!record) {
      return res.status(404).json({ message: 'ATS analysis record not found' })
    }

    res.json(record)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch ATS analysis record', error: error.message })
  }
}

export const deriveResumeFromAts = async (req, res) => {
  try {
    const { resumeId, jobDescriptionId, analysisRecordId } = req.body

    const [resume, jobDescription, analysisRecord] = await Promise.all([
      Resume.findOne({ _id: resumeId, userId: req.user._id }),
      JobDescription.findOne({ _id: jobDescriptionId, userId: req.user._id }),
      analysisRecordId ? AtsAnalysisRecord.findOne({ _id: analysisRecordId, userId: req.user._id }) : null,
    ])

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    if (!jobDescription) {
      return res.status(404).json({ message: 'Job description not found' })
    }

    const sourceVersion = await ResumeVersion.create({
      resumeId: resume._id,
      userId: req.user._id,
      versionName: `${resume.title} - 派生来源快照`,
      note: `为岗位 ${jobDescription.title}${jobDescription.company ? ` / ${jobDescription.company}` : ''} 创建定制版时生成的来源快照`,
      sourceResumeUpdatedAt: resume.updatedAt,
      sourceType: 'derived',
      derivedFromVersionId: resume.derivedFromVersionId || null,
      targetJobDescriptionId: jobDescription._id,
      snapshotMeta: {
        contentSource: resume.contentSource || 'structured',
        templateId: resume.template?.theme || '',
        analysisSummary: analysisRecord ? {
          overallScore: analysisRecord.overallScore,
          matchedKeywords: analysisRecord.matchedKeywords,
          missingKeywords: analysisRecord.missingKeywords,
          recommendedSections: analysisRecord.recommendedSections,
        } : null,
      },
      snapshot: buildResumeSnapshot(resume),
    })

    const derivedTitleParts = [jobDescription.title]
    if (jobDescription.company) {
      derivedTitleParts.push(jobDescription.company)
    }

    const derivedResume = await Resume.create({
      ...buildResumeSnapshot(resume),
      userId: req.user._id,
      title: `${derivedTitleParts.join(' - ')} 定制版`,
      derivedFromResumeId: resume._id,
      derivedFromVersionId: sourceVersion._id,
      targetJobDescriptionId: jobDescription._id,
      status: 'active',
    })

    const derivedVersion = await ResumeVersion.create({
      resumeId: derivedResume._id,
      userId: req.user._id,
      versionName: `${derivedResume.title} 初始版本`,
      note: `基于 ${resume.title} 为岗位 ${jobDescription.title} 自动派生`,
      sourceResumeUpdatedAt: derivedResume.updatedAt,
      sourceType: 'derived',
      derivedFromVersionId: sourceVersion._id,
      targetJobDescriptionId: jobDescription._id,
      snapshotMeta: {
        contentSource: derivedResume.contentSource || 'structured',
        templateId: derivedResume.template?.theme || '',
        analysisSummary: analysisRecord ? {
          overallScore: analysisRecord.overallScore,
          matchedKeywords: analysisRecord.matchedKeywords,
          missingKeywords: analysisRecord.missingKeywords,
          recommendedSections: analysisRecord.recommendedSections,
        } : null,
      },
      snapshot: buildResumeSnapshot(derivedResume),
    })

    if (analysisRecord) {
      analysisRecord.createdDerivedResumeId = derivedResume._id
      analysisRecord.createdDerivedVersionId = derivedVersion._id
      await analysisRecord.save()
    }

    res.status(201).json({
      resumeId: derivedResume._id,
      versionId: derivedVersion._id,
      analysisRecordId: analysisRecord?._id || null,
      derivedFromResumeId: resume._id,
      derivedFromVersionId: sourceVersion._id,
      targetJobDescriptionId: jobDescription._id,
      resume: derivedResume,
      version: derivedVersion,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to derive resume for job', error: error.message })
  }
}
