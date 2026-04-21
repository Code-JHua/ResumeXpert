const STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'from', 'that', 'this', 'will', 'have', 'your', 'you',
  'our', 'are', 'job', 'role', 'team', 'work', 'years', 'year', 'plus', 'using', 'into',
  'of', 'to', 'in', 'on', 'a', 'an', 'or', 'is', 'as', 'be', 'by', 'at', 'we', 'us',
  '负责', '要求', '熟悉', '能力', '相关', '经验', '以上', '岗位', '进行', '以及', '工作', '优先',
])

const DICTIONARY = {
  skills: [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'node', 'node.js', 'express',
    'mongodb', 'mysql', 'postgresql', 'redis', 'docker', 'kubernetes', 'aws', 'azure',
    'python', 'java', 'go', 'golang', 'rest', 'graphql', 'tailwind', 'vite', 'jest',
    'playwright', 'testing', 'ci/cd', 'git', 'linux', 'communication', 'leadership',
    '机器学习', '深度学习', '计算机视觉', '自然语言处理', '前端', '后端', '全栈', '算法',
  ],
  education: [
    'bachelor', 'master', 'phd', 'degree', 'computer science', 'software engineering',
    '本科', '硕士', '博士', '计算机', '软件工程',
  ],
  experience: [
    'project', 'architecture', 'performance', 'scalable', 'leadership', 'mentoring',
    'management', 'deployment', 'api', 'microservices', 'analytics', 'optimization',
    '项目', '架构', '性能', '优化', '部署', '管理', '协作', '设计',
  ],
}

const normalize = (value = '') => value.toString().toLowerCase().trim()

const unique = (items = []) => [...new Set(items.filter(Boolean))]

const tokenize = (text = '') => normalize(text)
  .replace(/[^\p{L}\p{N}+#./\s-]/gu, ' ')
  .split(/\s+/)
  .map((token) => token.trim())
  .filter((token) => token.length > 1 && !STOPWORDS.has(token))

export const extractKeywordsFromText = (text = '') => {
  const tokens = tokenize(text)
  const counts = new Map()

  tokens.forEach((token) => {
    counts.set(token, (counts.get(token) || 0) + 1)
  })

  const dictionaryMatches = {
    skills: [],
    education: [],
    experience: [],
  }

  Object.entries(DICTIONARY).forEach(([group, items]) => {
    items.forEach((item) => {
      if (normalize(text).includes(item)) {
        dictionaryMatches[group].push(item)
      }
    })
  })

  const ranked = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([token]) => token)

  return {
    keywords: unique([...ranked, ...dictionaryMatches.skills, ...dictionaryMatches.education, ...dictionaryMatches.experience]),
    skillKeywords: unique(dictionaryMatches.skills),
    educationKeywords: unique(dictionaryMatches.education),
    experienceKeywords: unique(dictionaryMatches.experience),
  }
}

const buildResumeCorpus = (resume = {}) => {
  const parts = []
  const push = (value) => {
    if (value) parts.push(value)
  }

  push(resume.title)
  push(resume.profileInfo?.fullName)
  push(resume.profileInfo?.designation)
  push(resume.profileInfo?.summary)

  ;(resume.skills || []).forEach((item) => push(item.name))
  ;(resume.workExperience || []).forEach((item) => {
    push(item.company)
    push(item.role)
    push(item.description)
  })
  ;(resume.projects || []).forEach((item) => {
    push(item.title)
    push(item.description)
    push(item.github)
    push(item.liveDemo)
  })
  ;(resume.education || []).forEach((item) => {
    push(item.degree)
    push(item.institution)
  })
  ;(resume.certifications || []).forEach((item) => {
    push(item.title)
    push(item.issuer)
  })
  ;(resume.languages || []).forEach((item) => push(item.name))
  ;(resume.interests || []).forEach((item) => push(item))

  return normalize(parts.join(' '))
}

const scoreKeywordSet = (sourceText, keywords = []) => {
  if (!keywords.length) {
    return {
      score: 100,
      matched: [],
      missing: [],
    }
  }

  const matched = keywords.filter((keyword) => sourceText.includes(normalize(keyword)))
  const missing = keywords.filter((keyword) => !sourceText.includes(normalize(keyword)))
  const score = Math.round((matched.length / keywords.length) * 100)

  return { score, matched, missing }
}

export const analyzeResumeAgainstJob = (resume, jobDescription) => {
  const resumeText = buildResumeCorpus(resume)
  const allKeywords = unique(jobDescription.keywords || [])
  const skillKeywords = unique(jobDescription.skillKeywords || [])
  const educationKeywords = unique(jobDescription.educationKeywords || [])
  const experienceKeywords = unique(jobDescription.experienceKeywords || [])

  const overall = scoreKeywordSet(resumeText, allKeywords)
  const skills = scoreKeywordSet(resumeText, skillKeywords)
  const education = scoreKeywordSet(resumeText, educationKeywords)
  const experience = scoreKeywordSet(resumeText, experienceKeywords)

  const recommendations = []

  if (skills.missing.length) {
    recommendations.push(`建议在技能或项目描述中补充：${skills.missing.slice(0, 4).join('、')}`)
  }
  if (experience.missing.length) {
    recommendations.push(`建议在工作经历中强调：${experience.missing.slice(0, 4).join('、')}`)
  }
  if (education.missing.length) {
    recommendations.push(`建议在教育背景或证书中补充：${education.missing.slice(0, 3).join('、')}`)
  }
  if (!recommendations.length) {
    recommendations.push('当前简历与岗位关键词匹配度较高，建议进一步优化量化成果和项目影响。')
  }

  const recommendedSections = unique([
    ...(skills.missing.length ? ['skills', 'projects'] : []),
    ...(experience.missing.length ? ['workExperience', 'projects'] : []),
    ...(education.missing.length ? ['education', 'certifications'] : []),
  ])

  return {
    overallScore: Math.round((overall.score * 0.5) + (skills.score * 0.2) + (experience.score * 0.2) + (education.score * 0.1)),
    matchedKeywords: overall.matched,
    missingKeywords: overall.missing,
    recommendations,
    recommendedSections,
    breakdown: {
      overall,
      skills,
      education,
      experience,
    },
    aiEnhancement: null,
  }
}

export const buildAiEnhancement = ({ analysis, resume, jobDescription }) => {
  if (!process.env.AI_ENHANCEMENT_ENABLED) {
    return null
  }

  return {
    summary: `可选 AI 增强已启用。建议围绕 ${jobDescription.title || '目标岗位'}，把 ${resume.profileInfo?.designation || '当前角色'} 的成果改写为更贴近岗位关键词的描述。`,
    rewrittenBullets: analysis.missingKeywords.slice(0, 3).map((keyword) => `补充一条包含“${keyword}”的量化成果描述。`),
  }
}

export const generateCoverLetterContent = ({ resume, jobDescription, analysis }) => {
  const fullName = resume?.profileInfo?.fullName || '候选人'
  const designation = resume?.profileInfo?.designation || '相关岗位候选人'
  const company = jobDescription?.company || '贵公司'
  const position = jobDescription?.title || '目标岗位'
  const highlights = (analysis?.matchedKeywords || []).slice(0, 4).join('、') || '项目实践、技术能力与跨团队协作'
  const strengths = [
    resume?.profileInfo?.summary,
    ...(resume?.workExperience || []).map((item) => item.description).filter(Boolean),
    ...(resume?.projects || []).map((item) => item.description).filter(Boolean),
  ].filter(Boolean).join(' ')

  return `尊敬的招聘团队：

您好！我是 ${fullName}，目前专注于 ${designation} 方向。了解到 ${company} 正在招聘 ${position}，我希望申请该岗位，并结合我的项目经历与岗位需求，展示我能够为团队带来的价值。

我的经历与岗位要求有较高匹配度，尤其体现在：${highlights}。${strengths || '我具备较扎实的专业基础、持续学习能力和良好的沟通协作意识。'}

在过往的学习和实践中，我持续围绕真实业务场景打磨自己的能力，注重结果导向、执行效率和团队协同。我相信这些经验能帮助我更快融入 ${company} 的工作节奏，并在 ${position} 岗位上产出实际价值。

感谢您阅读我的申请材料，期待有机会进一步交流。

此致
敬礼

${fullName}`
}
