import Application, { APPLICATION_STATUSES } from '../models/applicationModel.js'

const populateConfig = [
  { path: 'resumeId', select: 'title updatedAt' },
  { path: 'resumeVersionId', select: 'versionName createdAt note' },
  { path: 'jobDescriptionId', select: 'title company' },
  { path: 'coverLetterId', select: 'title updatedAt generationMode' },
]

export const createApplication = async (req, res) => {
  try {
    const application = await Application.create({
      userId: req.user._id,
      company: req.body.company,
      position: req.body.position,
      resumeId: req.body.resumeId || null,
      resumeVersionId: req.body.resumeVersionId || null,
      jobDescriptionId: req.body.jobDescriptionId || null,
      coverLetterId: req.body.coverLetterId || null,
      status: req.body.status || 'draft',
      appliedAt: req.body.appliedAt || null,
      nextActionAt: req.body.nextActionAt || null,
      notes: req.body.notes || '',
      timeline: req.body.timeline || [],
    })

    const populated = await application.populate(populateConfig)
    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: 'Failed to create application', error: error.message })
  }
}

export const getApplications = async (req, res) => {
  try {
    const query = { userId: req.user._id }

    if (req.query.status) {
      query.status = req.query.status
    }

    if (req.query.company) {
      query.company = new RegExp(req.query.company, 'i')
    }

    if (req.query.position) {
      query.position = new RegExp(req.query.position, 'i')
    }

    const applications = await Application.find(query)
      .populate(populateConfig)
      .sort({ updatedAt: -1 })

    res.json(applications)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch applications', error: error.message })
  }
}

export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: req.user._id })
      .populate(populateConfig)

    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }

    res.json(application)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch application', error: error.message })
  }
}

export const updateApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: req.user._id })
    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }

    const updatableFields = [
      'company', 'position', 'resumeId', 'resumeVersionId', 'jobDescriptionId',
      'coverLetterId', 'status', 'appliedAt', 'nextActionAt', 'notes',
    ]

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        application[field] = req.body[field]
      }
    })

    if (req.body.timeline) {
      application.timeline = req.body.timeline
    }

    const saved = await application.save()
    const populated = await saved.populate(populateConfig)
    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: 'Failed to update application', error: error.message })
  }
}

export const addApplicationTimelineItem = async (req, res) => {
  try {
    const application = await Application.findOne({ _id: req.params.id, userId: req.user._id })
    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }

    application.timeline.push({
      type: req.body.type,
      title: req.body.title,
      time: req.body.time,
      description: req.body.description || '',
    })

    if (req.body.status && APPLICATION_STATUSES.includes(req.body.status)) {
      application.status = req.body.status
    }

    const saved = await application.save()
    const populated = await saved.populate(populateConfig)
    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: 'Failed to add timeline item', error: error.message })
  }
}

export const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }
    res.json({ message: 'Application deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete application', error: error.message })
  }
}

export const getApplicationStats = async (req, res) => {
  try {
    const applications = await Application.find({ userId: req.user._id })
    const total = applications.length
    const offerCount = applications.filter((item) => item.status === 'offer').length
    const rejectedCount = applications.filter((item) => item.status === 'rejected').length
    const activeCount = applications.filter((item) => !['offer', 'rejected', 'archived'].includes(item.status)).length
    const conversionRate = total ? Math.round((offerCount / total) * 100) : 0

    const calendarItems = applications.flatMap((application) => {
      const items = []
      if (application.appliedAt) {
        items.push({
          applicationId: application._id,
          company: application.company,
          position: application.position,
          type: 'applied',
          time: application.appliedAt,
          title: `${application.company} - 已投递`,
        })
      }
      if (application.nextActionAt) {
        items.push({
          applicationId: application._id,
          company: application.company,
          position: application.position,
          type: 'next_action',
          time: application.nextActionAt,
          title: `${application.company} - 后续跟进`,
        })
      }

      return items.concat((application.timeline || []).map((item) => ({
        applicationId: application._id,
        company: application.company,
        position: application.position,
        type: item.type,
        time: item.time,
        title: item.title,
      })))
    }).sort((a, b) => new Date(a.time) - new Date(b.time))

    res.json({
      total,
      offerCount,
      rejectedCount,
      activeCount,
      conversionRate,
      statusOptions: APPLICATION_STATUSES,
      calendarItems,
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch application stats', error: error.message })
  }
}
