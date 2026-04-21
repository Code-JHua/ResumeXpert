import Resume from '../models/resumeModel.js'
import ResumeVersion from '../models/resumeVersionModel.js'

const buildSnapshot = (resume) => {
  const plainResume = resume.toObject ? resume.toObject() : resume
  const { _id, createdAt, updatedAt, __v, ...snapshot } = plainResume
  return snapshot
}

export const createResumeVersion = async (req, res) => {
  try {
    const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const version = await ResumeVersion.create({
      resumeId: resume._id,
      userId: req.user._id,
      versionName: req.body.versionName || `${resume.title} ${new Date().toLocaleString()}`,
      note: req.body.note || '',
      sourceResumeUpdatedAt: resume.updatedAt,
      sourceType: req.body.sourceType || resume.contentSource || 'manual',
      derivedFromVersionId: req.body.derivedFromVersionId || resume.derivedFromVersionId || null,
      targetJobDescriptionId: req.body.targetJobDescriptionId || resume.targetJobDescriptionId || null,
      snapshotMeta: req.body.snapshotMeta || {
        contentSource: resume.contentSource || 'structured',
        templateId: resume.template?.theme || '',
        status: resume.status || 'active',
      },
      snapshot: buildSnapshot(resume),
    })

    res.status(201).json(version)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create resume version', error: error.message })
  }
}

export const getResumeVersions = async (req, res) => {
  try {
    const versions = await ResumeVersion.find({
      resumeId: req.params.id,
      userId: req.user._id,
    }).sort({ createdAt: -1 })

    res.json(versions)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume versions', error: error.message })
  }
}

export const getResumeVersionById = async (req, res) => {
  try {
    const version = await ResumeVersion.findOne({
      _id: req.params.versionId,
      resumeId: req.params.id,
      userId: req.user._id,
    })

    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' })
    }

    res.json(version)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch resume version', error: error.message })
  }
}

export const restoreResumeVersion = async (req, res) => {
  try {
    const [resume, version] = await Promise.all([
      Resume.findOne({ _id: req.params.id, userId: req.user._id }),
      ResumeVersion.findOne({ _id: req.params.versionId, resumeId: req.params.id, userId: req.user._id }),
    ])

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' })
    }

    Object.assign(resume, version.snapshot)
    const saved = await resume.save()
    res.json(saved)
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore resume version', error: error.message })
  }
}

export const deleteResumeVersion = async (req, res) => {
  try {
    const version = await ResumeVersion.findOneAndDelete({
      _id: req.params.versionId,
      resumeId: req.params.id,
      userId: req.user._id,
    })

    if (!version) {
      return res.status(404).json({ message: 'Resume version not found' })
    }

    res.json({ message: 'Resume version deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete resume version', error: error.message })
  }
}
