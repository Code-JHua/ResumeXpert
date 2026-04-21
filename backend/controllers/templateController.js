import Template from '../models/templateModel.js'
import Resume from '../models/resumeModel.js'
import { DEFAULT_TEMPLATES } from '../data/defaultTemplates.js'
import { DEFAULT_TEMPLATE_BLOCKS } from '../data/defaultTemplateBlocks.js'

const normalizeSlug = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')

const toTemplateResponse = (template, userId) => {
  const data = template.toObject ? template.toObject() : template
  const favoriteIds = (data.favoriteUserIds || []).map((id) => String(id))

  return {
    ...data,
    id: data.templateId,
    isFavorite: userId ? favoriteIds.includes(String(userId)) : false,
    favoriteCount: favoriteIds.length,
    isOwned: Boolean(userId && data.ownerId && String(data.ownerId) === String(userId)),
  }
}

const seedDefaultTemplates = async () => {
  await Promise.all(
    DEFAULT_TEMPLATES.map((template) =>
      Template.findOneAndUpdate(
        { templateId: template.templateId },
        {
          $set: {
            ...template,
            communityMeta: template.communityMeta || {},
          },
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        }
      )
    )
  )
}

export const getTemplates = async (req, res) => {
  try {
    await seedDefaultTemplates()

    const query = {
      $or: [
        { sourceType: 'official' },
        { sourceType: 'community', 'communityMeta.reviewStatus': 'approved' },
        { ownerId: req.user?._id || null },
      ],
    }

    if (req.query.scope === 'favorites' && req.user?._id) {
      query.favoriteUserIds = req.user._id
    }

    if (req.query.scope === 'mine' && req.user?._id) {
      query.ownerId = req.user._id
      delete query.$or
    }

    if (req.query.sourceType) {
      query.sourceType = req.query.sourceType
    }

    if (req.query.category) {
      query.category = req.query.category
    }

    if (req.query.status) {
      query.status = req.query.status
    }

    if (req.query.reviewStatus) {
      query['communityMeta.reviewStatus'] = req.query.reviewStatus
    }

    const templates = await Template.find(query).sort({ sortOrder: 1, createdAt: -1 })
    res.json(templates.map((template) => toTemplateResponse(template, req.user?._id)))
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch templates', error: error.message })
  }
}

export const getTemplateById = async (req, res) => {
  try {
    await seedDefaultTemplates()
    const template = await Template.findOne({ templateId: req.params.id })
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    res.json(toTemplateResponse(template, req.user?._id))
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch template', error: error.message })
  }
}

export const toggleFavoriteTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({ templateId: req.params.id })
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    const userId = String(req.user._id)
    const hasFavorite = template.favoriteUserIds.some((id) => String(id) === userId)

    template.favoriteUserIds = hasFavorite
      ? template.favoriteUserIds.filter((id) => String(id) !== userId)
      : [...template.favoriteUserIds, req.user._id]

    await template.save()
    res.json(toTemplateResponse(template, req.user._id))
  } catch (error) {
    res.status(500).json({ message: 'Failed to update favorite state', error: error.message })
  }
}

export const duplicateTemplate = async (req, res) => {
  try {
    const sourceTemplate = await Template.findOne({ templateId: req.params.id })
    if (!sourceTemplate) {
      return res.status(404).json({ message: 'Template not found' })
    }

    if (!sourceTemplate.allowDuplicate) {
      return res.status(400).json({ message: 'Template duplication is disabled' })
    }

    const copyCount = await Template.countDocuments({ ownerId: req.user._id, sourceTemplateId: sourceTemplate._id })
    const name = req.body.name?.trim() || `${sourceTemplate.name} 副本 ${copyCount + 1}`
    const templateId = `custom-${req.user._id}-${Date.now()}`
    const duplicate = await Template.create({
      templateId,
      rendererKey: sourceTemplate.rendererKey,
      sourceTemplateId: sourceTemplate._id,
      ownerId: req.user._id,
      name,
      slug: normalizeSlug(name) || templateId,
      description: req.body.description?.trim() || `基于 ${sourceTemplate.name} 复制的个人模板`,
      thumbnail: sourceTemplate.thumbnail,
      sourceType: 'custom',
      category: sourceTemplate.category,
      status: 'active',
      authorName: req.user.name || 'My Template',
      supportedContentTypes: sourceTemplate.supportedContentTypes,
      tags: [...sourceTemplate.tags, 'custom-copy'],
      sortOrder: 200,
      allowDuplicate: true,
      themeSchema: sourceTemplate.themeSchema,
      communityMeta: {
        ...sourceTemplate.communityMeta?.toObject?.(),
        canPublishToCommunity: true,
        reviewStatus: 'reserved',
      },
    })

    sourceTemplate.duplicateCount += 1
    await sourceTemplate.save()

    res.status(201).json(toTemplateResponse(duplicate, req.user._id))
  } catch (error) {
    res.status(500).json({ message: 'Failed to duplicate template', error: error.message })
  }
}

export const applyTemplateToResume = async (req, res) => {
  try {
    const template = await Template.findOne({ templateId: req.params.id })
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    const resume = await Resume.findOne({ _id: req.body.resumeId, userId: req.user._id })
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' })
    }

    const nextSettings = {
      ...(template.themeSchema?.defaultConfig || {}),
      ...(req.body.themeSettings || {}),
      layoutMode: req.body.layoutMode || template.blockSchema?.layoutMode || 'fixed',
      blockConfig: req.body.blockConfig || template.blockSchema?.blocks || DEFAULT_TEMPLATE_BLOCKS,
    }

    resume.template = {
      ...(resume.template || {}),
      theme: template.rendererKey,
      templateId: template.templateId,
      settings: nextSettings,
    }

    await resume.save()

    template.usageCount += 1
    await template.save()

    res.json({
      message: 'Template applied successfully',
      resume,
      template: toTemplateResponse(template, req.user._id),
    })
  } catch (error) {
    res.status(500).json({ message: 'Failed to apply template', error: error.message })
  }
}

export const createTemplate = async (req, res) => {
  try {
    const name = req.body.name?.trim()
    const rendererKey = req.body.rendererKey?.trim()

    if (!name || !rendererKey) {
      return res.status(400).json({ message: 'name and rendererKey are required' })
    }

    const templateId = req.body.templateId?.trim() || `custom-${req.user._id}-${Date.now()}`
    const template = await Template.create({
      templateId,
      rendererKey,
      ownerId: req.user._id,
      sourceTemplateId: req.body.sourceTemplateId || null,
      name,
      slug: normalizeSlug(req.body.slug || name) || templateId,
      description: req.body.description || '',
      thumbnail: req.body.thumbnail || '',
      sourceType: req.body.sourceType || 'custom',
      category: req.body.category || 'general',
      status: req.body.status || 'draft',
      authorName: req.body.authorName || req.user.name || 'ResumeXpert User',
      supportedContentTypes: req.body.supportedContentTypes || ['structured', 'markdown', 'imported'],
      tags: req.body.tags || [],
      sortOrder: req.body.sortOrder ?? 300,
      isFeatured: Boolean(req.body.isFeatured),
      allowDuplicate: req.body.allowDuplicate !== false,
      themeSchema: req.body.themeSchema || {
        defaultConfig: {},
        presets: [],
        supportedOptions: ['accentColor', 'headingColor', 'tagBackground', 'fontFamily', 'density'],
      },
      blockSchema: req.body.blockSchema || {
        layoutMode: 'two-column',
        availableLayouts: ['single', 'two-column'],
        blocks: DEFAULT_TEMPLATE_BLOCKS,
      },
      communityMeta: req.body.communityMeta || {
        canPublishToCommunity: true,
        reviewStatus: 'reserved',
        reservedFields: ['coverImage', 'license', 'reviewNotes'],
      },
    })

    res.status(201).json(toTemplateResponse(template, req.user._id))
  } catch (error) {
    res.status(500).json({ message: 'Failed to create template', error: error.message })
  }
}

export const updateTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({ templateId: req.params.id })
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    const isOwned = template.ownerId && String(template.ownerId) === String(req.user._id)
    const isOfficial = template.sourceType === 'official'
    if (!isOwned && !isOfficial) {
      return res.status(403).json({ message: 'Not allowed to update this template' })
    }

    const fields = [
      'name', 'description', 'thumbnail', 'category', 'status',
      'authorName', 'supportedContentTypes', 'tags', 'sortOrder',
      'isFeatured', 'allowDuplicate', 'themeSchema', 'blockSchema', 'communityMeta',
    ]

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        template[field] = req.body[field]
      }
    })

    if (req.body.slug !== undefined) {
      template.slug = normalizeSlug(req.body.slug || template.name) || template.templateId
    }

    if (req.body.rendererKey !== undefined) {
      template.rendererKey = req.body.rendererKey
    }

    await template.save()
    res.json(toTemplateResponse(template, req.user._id))
  } catch (error) {
    res.status(500).json({ message: 'Failed to update template', error: error.message })
  }
}

export const submitTemplateToCommunity = async (req, res) => {
  try {
    const template = await Template.findOne({ templateId: req.params.id, ownerId: req.user._id })
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    template.sourceType = 'community'
    template.communityMeta = {
      ...template.communityMeta?.toObject?.(),
      canPublishToCommunity: true,
      reviewStatus: 'pending',
      submitterNote: req.body.submitterNote || '',
      submittedAt: new Date(),
      reviewedAt: null,
      reviewerName: '',
      reviewNotes: '',
    }

    await template.save()
    res.json(toTemplateResponse(template, req.user._id))
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit template to community', error: error.message })
  }
}

export const getTemplateReviewQueue = async (req, res) => {
  try {
    await seedDefaultTemplates()
    const query = { sourceType: 'community' }

    if (req.query.reviewStatus) {
      query['communityMeta.reviewStatus'] = req.query.reviewStatus
    } else {
      query['communityMeta.reviewStatus'] = { $in: ['pending', 'rejected', 'approved'] }
    }

    const templates = await Template.find(query).sort({ 'communityMeta.submittedAt': -1, updatedAt: -1 })
    res.json(templates.map((template) => toTemplateResponse(template, req.user?._id)))
  } catch (error) {
    res.status(500).json({ message: 'Failed to load review queue', error: error.message })
  }
}

export const reviewTemplateSubmission = async (req, res) => {
  try {
    const template = await Template.findOne({ templateId: req.params.id, sourceType: 'community' })
    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    const decision = req.body.decision
    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be approved or rejected' })
    }

    template.communityMeta = {
      ...template.communityMeta?.toObject?.(),
      reviewStatus: decision,
      reviewNotes: req.body.reviewNotes || '',
      reviewerName: req.user.name || 'Reviewer',
      reviewedAt: new Date(),
    }

    await template.save()
    res.json(toTemplateResponse(template, req.user._id))
  } catch (error) {
    res.status(500).json({ message: 'Failed to review template submission', error: error.message })
  }
}
