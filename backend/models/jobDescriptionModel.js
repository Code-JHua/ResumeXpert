import mongoose from 'mongoose'

const JobDescriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    default: '',
    trim: true,
  },
  sourceText: {
    type: String,
    required: true,
    trim: true,
  },
  keywords: {
    type: [String],
    default: [],
  },
  skillKeywords: {
    type: [String],
    default: [],
  },
  educationKeywords: {
    type: [String],
    default: [],
  },
  experienceKeywords: {
    type: [String],
    default: [],
  },
}, { timestamps: true })

export default mongoose.model('JobDescription', JobDescriptionSchema)
