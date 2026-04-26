const rendererLoaders = {
  '01': () => import('../components/TemplateOne.jsx'),
  '02': () => import('../components/TemplateTwo.jsx'),
  '03': () => import('../components/TemplateThree.jsx'),
  flex: () => import('../components/FlexibleTemplate.jsx'),
}

const thumbnailMap = {
  '01': new URL('../assets/Resume1.png', import.meta.url).href,
  '02': new URL('../assets/Resume2.png', import.meta.url).href,
  '03': new URL('../assets/Resume3.png', import.meta.url).href,
  flex: new URL('../assets/Resume1.png', import.meta.url).href,
}

const RENDERER_REGISTRY = [
  {
    rendererKey: '01',
    name: 'Classic Professional',
    thumbnail: thumbnailMap['01'],
  },
  {
    rendererKey: '02',
    name: 'Modern Sidebar',
    thumbnail: thumbnailMap['02'],
  },
  {
    rendererKey: '03',
    name: 'Compact ATS',
    thumbnail: thumbnailMap['03'],
  },
  {
    rendererKey: 'flex',
    name: 'Flexible Studio',
    thumbnail: thumbnailMap.flex,
  },
]

const registryMap = new Map(RENDERER_REGISTRY.map((template) => [template.rendererKey, template]))
const rendererCache = new Map()

export const getRegisteredTemplates = () => RENDERER_REGISTRY

export const getTemplateRendererMeta = (rendererKey) => {
  return registryMap.get(rendererKey) || RENDERER_REGISTRY[0]
}

export const loadTemplateRenderer = async (rendererKey) => {
  const resolvedMeta = getTemplateRendererMeta(rendererKey)
  const cacheKey = resolvedMeta.rendererKey

  if (rendererCache.has(cacheKey)) {
    return rendererCache.get(cacheKey)
  }

  const module = await (rendererLoaders[cacheKey] || rendererLoaders[RENDERER_REGISTRY[0].rendererKey])()
  const renderer = module.default
  rendererCache.set(cacheKey, renderer)
  return renderer
}

export const getTemplateMetadata = (template) => {
  if (!template) return null

  const registryTemplate = getTemplateRendererMeta(template.rendererKey || template.theme || template.id)
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
