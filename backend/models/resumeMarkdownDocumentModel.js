import mongoose from 'mongoose'

const ResumeMarkdownDocumentSchema = new mongoose.Schema({
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
  title: {
    type: String,
    default: 'Untitled Markdown Resume',
    trim: true,
  },
  content: {
    type: String,
    default: '',
  },
  parsedStructuredSnapshot: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  syncStatus: {
    type: String,
    enum: ['not_synced', 'synced', 'outdated', 'error'],
    default: 'not_synced',
  },
  lastSyncedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true })

export default mongoose.model('ResumeMarkdownDocument', ResumeMarkdownDocumentSchema)
