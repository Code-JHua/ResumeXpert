import mongoose from 'mongoose'

const ResumeVersionSchema = new mongoose.Schema({
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  versionName: {
    type: String,
    required: true,
    trim: true,
  },
  note: {
    type: String,
    default: '',
    trim: true,
  },
  sourceResumeUpdatedAt: {
    type: Date,
    default: null,
  },
  sourceType: {
    type: String,
    enum: ['manual', 'structured', 'markdown', 'imported', 'derived'],
    default: 'manual',
  },
  derivedFromVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion',
    default: null,
  },
  snapshotMeta: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  snapshot: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
}, { timestamps: true })

export default mongoose.model('ResumeVersion', ResumeVersionSchema)
