import mongoose from 'mongoose'

const AtsAnalysisRecordSchema = new mongoose.Schema({
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
  resumeVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion',
    default: null,
  },
  jobDescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    required: true,
  },
  overallScore: {
    type: Number,
    default: 0,
  },
  matchedKeywords: {
    type: [String],
    default: [],
  },
  missingKeywords: {
    type: [String],
    default: [],
  },
  recommendations: {
    type: [String],
    default: [],
  },
  recommendedSections: {
    type: [String],
    default: [],
  },
  aiEnhancement: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  breakdown: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdDerivedResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null,
  },
  createdDerivedVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion',
    default: null,
  },
}, { timestamps: true })

export default mongoose.model('AtsAnalysisRecord', AtsAnalysisRecordSchema)
