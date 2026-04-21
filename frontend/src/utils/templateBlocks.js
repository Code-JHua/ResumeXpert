export const DEFAULT_TEMPLATE_BLOCKS = [
  { key: 'summary', title: '个人总结', visible: true, column: 'main', order: 10 },
  { key: 'workExperience', title: '工作经历', visible: true, column: 'main', order: 20 },
  { key: 'projects', title: '项目经历', visible: true, column: 'main', order: 30 },
  { key: 'education', title: '教育经历', visible: true, column: 'sidebar', order: 40 },
  { key: 'skills', title: '技能标签', visible: true, column: 'sidebar', order: 50 },
  { key: 'certifications', title: '证书资质', visible: true, column: 'sidebar', order: 60 },
  { key: 'languages', title: '语言能力', visible: true, column: 'sidebar', order: 70 },
  { key: 'interests', title: '兴趣方向', visible: true, column: 'sidebar', order: 80 },
  { key: 'freeBlocks', title: '自定义补充', visible: true, column: 'main', order: 90 },
]

export const resolveBlockConfig = (template, templateState = {}) => {
  const templateBlocks = template?.blockSchema?.blocks || DEFAULT_TEMPLATE_BLOCKS
  const runtimeBlocks = templateState?.settings?.blockConfig || templateState?.blockConfig || []

  if (!runtimeBlocks.length) {
    return templateBlocks
  }

  const runtimeMap = new Map(runtimeBlocks.map((block) => [block.key, block]))
  const merged = templateBlocks.map((block) => ({
    ...block,
    ...(runtimeMap.get(block.key) || {}),
  }))

  runtimeBlocks.forEach((block) => {
    if (!merged.some((item) => item.key === block.key)) {
      merged.push(block)
    }
  })

  return merged.sort((a, b) => (a.order || 0) - (b.order || 0))
}

export const getSectionContentMap = (resumeData = {}) => ({
  summary: Boolean(resumeData?.profileInfo?.summary?.trim()),
  workExperience: Array.isArray(resumeData?.workExperience) && resumeData.workExperience.some((item) => item?.role || item?.company || item?.description),
  projects: Array.isArray(resumeData?.projects) && resumeData.projects.some((item) => item?.title || item?.description),
  education: Array.isArray(resumeData?.education) && resumeData.education.some((item) => item?.degree || item?.institution),
  skills: Array.isArray(resumeData?.skills) && resumeData.skills.some((item) => item?.name),
  certifications: Array.isArray(resumeData?.certifications) && resumeData.certifications.some((item) => item?.title || item?.issuer || item?.year),
  languages: Array.isArray(resumeData?.languages) && resumeData.languages.some((item) => item?.name),
  interests: Array.isArray(resumeData?.interests) && resumeData.interests.some(Boolean),
  freeBlocks: Array.isArray(resumeData?.freeBlocks) && resumeData.freeBlocks.some((item) => item?.content),
})
