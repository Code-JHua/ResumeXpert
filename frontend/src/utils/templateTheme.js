const DEFAULT_THEME = {
  accentColor: '#4f46e5',
  headingColor: '#0f172a',
  tagBackground: '#ede9fe',
  fontFamily: '"Segoe UI", "PingFang SC", sans-serif',
  density: 'comfortable',
}

export const resolveTemplateTheme = (template, templateState = {}) => {
  const defaultConfig = template?.themeSchema?.defaultConfig || {}
  const settings = templateState?.settings || {}

  return {
    ...DEFAULT_THEME,
    ...defaultConfig,
    ...settings,
  }
}

export const getDensityClassName = (density) => {
  if (density === 'compact') return 'resume-density-compact'
  if (density === 'spacious') return 'resume-density-spacious'
  return 'resume-density-comfortable'
}
