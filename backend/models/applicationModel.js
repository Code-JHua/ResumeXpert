import mongoose from 'mongoose'

export const APPLICATION_STATUSES = [
  'draft',
  'applied',
  'written_test',
  'first_interview',
  'second_interview',
  'hr_interview',
  'offer',
  'rejected',
  'archived',
]

const TimelineItemSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  time: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
}, { _id: true })

const ApplicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  position: {
    type: String,
    required: true,
    trim: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null,
  },
  resumeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion',
    default: null,
  },
  jobDescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    default: null,
  },
  coverLetterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CoverLetter',
    default: null,
  },
  sourceAnalysisId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AtsAnalysisRecord',
    default: null,
  },
  status: {
    type: String,
    enum: APPLICATION_STATUSES,
    default: 'draft',
  },
  appliedAt: {
    type: Date,
    default: null,
  },
  nextActionAt: {
    type: Date,
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
  timeline: {
    type: [TimelineItemSchema],
    default: [],
  },
}, { timestamps: true })

export default mongoose.model('Application', ApplicationSchema)
