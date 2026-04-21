import mongoose from 'mongoose'

const ThemePresetSchema = new mongoose.Schema({
  id: String,
  label: String,
  accentColor: String,
  headingColor: String,
  tagBackground: String,
}, { _id: false })

const ThemeSchemaSchema = new mongoose.Schema({
  defaultConfig: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  presets: {
    type: [ThemePresetSchema],
    default: [],
  },
  supportedOptions: {
    type: [String],
    default: [],
  },
}, { _id: false })

const TemplateBlockSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    trim: true,
  },
  title: {
    type: String,
    default: '',
    trim: true,
  },
  visible: {
    type: Boolean,
    default: true,
  },
  column: {
    type: String,
    enum: ['main', 'sidebar', 'full'],
    default: 'main',
  },
  order: {
    type: Number,
    default: 0,
  },
}, { _id: false })

const BlockSchemaSchema = new mongoose.Schema({
  layoutMode: {
    type: String,
    enum: ['fixed', 'single', 'two-column'],
    default: 'fixed',
  },
  availableLayouts: {
    type: [String],
    default: ['single', 'two-column'],
  },
  blocks: {
    type: [TemplateBlockSchema],
    default: [],
  },
}, { _id: false })

const CommunityMetaSchema = new mongoose.Schema({
  canPublishToCommunity: {
    type: Boolean,
    default: false,
  },
  reviewStatus: {
    type: String,
    enum: ['official', 'not_open', 'reserved', 'pending', 'approved', 'rejected'],
    default: 'reserved',
  },
  reservedFields: {
    type: [String],
    default: [],
  },
  coverImage: {
    type: String,
    default: '',
  },
  license: {
    type: String,
    default: '',
  },
  reviewNotes: {
    type: String,
    default: '',
  },
  submitterNote: {
    type: String,
    default: '',
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
  reviewerName: {
    type: String,
    default: '',
  },
}, { _id: false })

const TemplateSchema = new mongoose.Schema({
  templateId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  rendererKey: {
    type: String,
    required: true,
    trim: true,
  },
  sourceTemplateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Template',
    default: null,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  slug: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    trim: true,
  },
  thumbnail: {
    type: String,
    default: '',
  },
  sourceType: {
    type: String,
    enum: ['official', 'community', 'custom'],
    default: 'official',
  },
  category: {
    type: String,
    default: 'general',
    trim: true,
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'active',
  },
  authorName: {
    type: String,
    default: '',
    trim: true,
  },
  supportedContentTypes: {
    type: [String],
    default: ['structured'],
  },
  tags: {
    type: [String],
    default: [],
  },
  sortOrder: {
    type: Number,
    default: 100,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  allowDuplicate: {
    type: Boolean,
    default: true,
  },
  favoriteUserIds: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  duplicateCount: {
    type: Number,
    default: 0,
  },
  themeSchema: {
    type: ThemeSchemaSchema,
    default: () => ({}),
  },
  blockSchema: {
    type: BlockSchemaSchema,
    default: () => ({}),
  },
  communityMeta: {
    type: CommunityMetaSchema,
    default: () => ({}),
  },
}, { timestamps: true })

export default mongoose.model('Template', TemplateSchema)
