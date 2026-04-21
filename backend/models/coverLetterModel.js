import mongoose from 'mongoose'

const CoverLetterSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null,
  },
  jobDescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    default: null,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String,
    default: '',
  },
  generationMode: {
    type: String,
    enum: ['manual', 'template', 'ai-enhanced'],
    default: 'manual',
  },
}, { timestamps: true })

export default mongoose.model('CoverLetter', CoverLetterSchema)
