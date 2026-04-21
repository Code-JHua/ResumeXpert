import mongoose from 'mongoose'

const SharedResumePageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
    unique: true,
  },
  resumeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion',
    default: null,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  title: {
    type: String,
    default: 'Untitled Shared Resume',
    trim: true,
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'disabled'],
    default: 'draft',
  },
  isEnabled: {
    type: Boolean,
    default: false,
  },
  visibility: {
    type: String,
    enum: ['public'],
    default: 'public',
  },
  lastPublishedAt: {
    type: Date,
    default: null,
  },
  lastViewedAt: {
    type: Date,
    default: null,
  },
  viewCount: {
    type: Number,
    default: 0,
  },
  uniqueVisitorCount: {
    type: Number,
    default: 0,
  },
  visitorHashes: {
    type: [String],
    default: [],
    select: false,
  },
  lastSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  themeSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, { timestamps: true })

export default mongoose.model('SharedResumePage', SharedResumePageSchema)
