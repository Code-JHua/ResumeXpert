import Resume1 from '../assets/Resume1.png'
import Resume2 from '../assets/Resume2.png'
import Resume3 from '../assets/Resume3.png'
import TemplateOne from '../components/TemplateOne.jsx'
import TemplateTwo from '../components/TemplateTwo.jsx'
import TemplateThree from '../components/TemplateThree.jsx'

const TEMPLATE_REGISTRY = [
  {
    id: '01',
    name: 'Classic Professional',
    renderer: TemplateOne,
    thumbnail: Resume1,
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
    renderer: TemplateTwo,
    thumbnail: Resume2,
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
    renderer: TemplateThree,
    thumbnail: Resume3,
    category: 'official',
    description: 'Compact layout optimized for dense professional experience.',
    supportedContentTypes: ['structured', 'markdown', 'imported'],
    themeSchema: {
      colorPalette: [],
      typography: 'default',
    },
  },
]

export const getRegisteredTemplates = () => TEMPLATE_REGISTRY

export const getTemplateById = (templateId) => {
  return TEMPLATE_REGISTRY.find((template) => template.id === templateId) || TEMPLATE_REGISTRY[0]
}

export const mergeTemplateMetadata = (templates = []) => {
  const registryMap = new Map(TEMPLATE_REGISTRY.map((template) => [template.id, template]))

  if (!templates.length) {
    return TEMPLATE_REGISTRY
  }

  return templates.map((template) => ({
    ...registryMap.get(template.id),
    ...template,
    thumbnail: registryMap.get(template.id)?.thumbnail || template.thumbnail,
  }))
}
