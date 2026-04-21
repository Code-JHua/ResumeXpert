import mongoose from 'mongoose'

const ResumeImportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sourceType: {
    type: String,
    enum: ['markdown', 'pdf', 'scanned_pdf', 'word', 'manual'],
    default: 'manual',
  },
  originalFileName: {
    type: String,
    default: '',
    trim: true,
  },
  fileUrl: {
    type: String,
    default: '',
  },
  rawText: {
    type: String,
    default: '',
  },
  parsedSections: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  mappedResumeDraft: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  confidenceSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  unresolvedFields: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
  status: {
    type: String,
    enum: ['uploaded', 'extracting', 'parsed', 'needs_confirmation', 'confirmed', 'failed'],
    default: 'uploaded',
  },
  failureReason: {
    type: String,
    default: '',
  },
  confirmedResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null,
  },
  manualCorrections: {
    type: [mongoose.Schema.Types.Mixed],
    default: [],
  },
}, { timestamps: true })

export default mongoose.model('ResumeImport', ResumeImportSchema)
