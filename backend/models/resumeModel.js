import mongoose from 'mongoose'

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  thumbnailLink: {
    type: String,
  },
  template: {
    theme: {
      type: String,
      default: '01'
    },
    colorPalette: [String]
  },
  completion: {
    type: Number,
    default: 0
  },
  contentSource: {
    type: String,
    enum: ['structured', 'markdown', 'imported'],
    default: 'structured'
  },
  sourceDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeMarkdownDocument',
    default: null
  },
  sourceImportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeImport',
    default: null
  },
  derivedFromResumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    default: null
  },
  derivedFromVersionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ResumeVersion',
    default: null
  },
  targetJobDescriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobDescription',
    default: null
  },
  freeBlocks: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active'
  },

  profileInfo: {
    profilePreview: String,
    fullName: String,
    designation: String,
    summary: String
  },

  contactInfo: {
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    github: String,
    website: String,
  },

  //work experience
  workExperience: [
    {
      company: String,
      role: String,
      startDate: String,
      endDate: String,
      description: String,
    }
  ],

  education: [
    {
      degree: String,
      institution: String,
      startDate: String,
      endDate: String,
    }
  ],

  skills: [
    {
      name: String,
      progress: Number,
    }
  ],

  projects: [
    {
      title: String,
      description: String,
      github: String,
      liveDemo: String,
    }
  ],

  certifications: [
    {
      title: String,
      issuer: String,
      year: String,
    }
  ],

  languages: [
    {
      name: String,
      progress: Number,
    }
  ],

  interests: [String]
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  }
})

export default mongoose.model('Resume', ResumeSchema)
