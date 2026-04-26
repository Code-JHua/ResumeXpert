import mongoose from 'mongoose'

const ExportLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: true,
  },
  format: {
    type: String,
    enum: ['pdf', 'markdown', 'share', 'docx'],
    required: true,
  },
  templateId: {
    type: String,
    default: '',
  },
  resumeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion',
    default: null,
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'pending',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true })

export default mongoose.model('ExportLog', ExportLogSchema)
