const builtInTemplates = [
  {
    id: '01',
    name: 'Classic Professional',
    thumbnail: '/static/templates/01.png',
    category: 'official',
    description: 'Balanced one-column resume for general professional use.',
    supportedContentTypes: ['structured', 'markdown', 'imported'],
    themeSchema: {
      colorPalette: [],
      typography: 'default',
    },
  },
  {
    id: '02',
    name: 'Modern Sidebar',
    thumbnail: '/static/templates/02.png',
    category: 'official',
    description: 'Two-column layout highlighting skills and contact details.',
    supportedContentTypes: ['structured', 'markdown', 'imported'],
    themeSchema: {
      colorPalette: [],
      typography: 'default',
    },
  },
  {
    id: '03',
    name: 'Compact ATS',
    thumbnail: '/static/templates/03.png',
    category: 'official',
    description: 'Compact layout optimized for dense professional experience.',
    supportedContentTypes: ['structured', 'markdown', 'imported'],
    themeSchema: {
      colorPalette: [],
      typography: 'default',
    },
  },
]

export const getTemplates = async (req, res) => {
  res.json(builtInTemplates)
}

export const getTemplatePreview = async (req, res) => {
  const template = builtInTemplates.find((item) => item.id === req.params.id)
  if (!template) {
    return res.status(404).json({ message: 'Template not found' })
  }

  res.json(template)
}
