import Resume1 from '../assets/Resume1.png'
import Resume2 from '../assets/Resume2.png'
import Resume3 from '../assets/Resume3.png'
import TemplateOne from '../components/TemplateOne.jsx'
import TemplateTwo from '../components/TemplateTwo.jsx'
import TemplateThree from '../components/TemplateThree.jsx'
import FlexibleTemplate from '../components/FlexibleTemplate.jsx'

const RENDERER_REGISTRY = [
  {
    rendererKey: '01',
    name: 'Classic Professional',
    renderer: TemplateOne,
    thumbnail: Resume1,
  },
  {
    rendererKey: '02',
    name: 'Modern Sidebar',
    renderer: TemplateTwo,
    thumbnail: Resume2,
  },
  {
    rendererKey: '03',
    name: 'Compact ATS',
    renderer: TemplateThree,
    thumbnail: Resume3,
  },
  {
    rendererKey: 'flex',
    name: 'Flexible Studio',
    renderer: FlexibleTemplate,
    thumbnail: Resume1,
  },
]

const registryMap = new Map(RENDERER_REGISTRY.map((template) => [template.rendererKey, template]))

export const getRegisteredTemplates = () => RENDERER_REGISTRY

export const getTemplateRenderer = (rendererKey) => {
  return registryMap.get(rendererKey) || RENDERER_REGISTRY[0]
}

export const getTemplateMetadata = (template) => {
  if (!template) return null

  const registryTemplate = getTemplateRenderer(template.rendererKey || template.theme || template.id)
  return {
    ...registryTemplate,
    ...template,
    thumbnail: template.thumbnail || registryTemplate?.thumbnail,
    rendererKey: template.rendererKey || registryTemplate?.rendererKey,
  }
}

export const mergeTemplateMetadata = (templates = []) => {
  if (!templates.length) {
    return RENDERER_REGISTRY.map((template) => ({
      id: template.rendererKey,
      templateId: template.rendererKey,
      sourceType: 'official',
      category: 'general',
      description: '',
      supportedContentTypes: ['structured', 'markdown', 'imported'],
      tags: [],
      ...template,
    }))
  }

  return templates.map((template) => getTemplateMetadata(template))
}
