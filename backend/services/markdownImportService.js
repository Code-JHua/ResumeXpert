const normalizeLine = (line = '') => line.replace(/\r/g, '').trim()

const extractContacts = (rawText) => {
  const emailMatch = rawText.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)
  const phoneMatch = rawText.match(/(\+?\d[\d\s().-]{6,}\d)/g)
  const linkedinMatch = rawText.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)]+/i)
  const githubMatch = rawText.match(/https?:\/\/(?:www\.)?github\.com\/[^\s)]+/i)
  const websiteMatch = rawText.match(/https?:\/\/[^\s)]+/i)

  return {
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0] || '',
    linkedin: linkedinMatch?.[0] || '',
    github: githubMatch?.[0] || '',
    website: websiteMatch?.[0] || '',
  }
}

const sectionKeyMap = {
  summary: 'summary',
  about: 'summary',
  profile: 'summary',
  'professional summary': 'summary',
  experience: 'workExperience',
  'work experience': 'workExperience',
  employment: 'workExperience',
  education: 'education',
  skills: 'skills',
  projects: 'projects',
  certifications: 'certifications',
  certificates: 'certifications',
  languages: 'languages',
  interests: 'interests',
  contact: 'contact',
}

const defaultDraft = () => ({
  title: 'Imported Resume',
  profileInfo: {
    fullName: '',
    designation: '',
    summary: '',
  },
  contactInfo: {
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    website: '',
  },
  workExperience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  interests: [],
  freeBlocks: [],
})

const summarizeConfidence = (fieldScores = {}) => {
  const summary = { high: 0, medium: 0, low: 0, fields: fieldScores }

  Object.values(fieldScores).forEach((score) => {
    if (typeof score !== 'number') return
    if (score >= 0.85) {
      summary.high += 1
    } else if (score >= 0.5) {
      summary.medium += 1
    } else {
      summary.low += 1
    }
  })

  return summary
}

const pushFreeBlock = (draft, title, lines, source = 'markdown') => {
  const content = lines.join('\n').trim()
  if (!content) return

  draft.freeBlocks.push({
    type: 'markdown_section',
    title,
    content,
    source,
  })
}

const toBulletLines = (lines = []) => lines
  .map((line) => normalizeLine(line).replace(/^[-*]\s*/, ''))
  .filter(Boolean)

const parseNamedSection = (draft, currentSection, lines) => {
  const cleanLines = lines.map((line) => normalizeLine(line)).filter(Boolean)
  if (!cleanLines.length) return

  switch (currentSection) {
    case 'summary':
      draft.profileInfo.summary = cleanLines.join(' ')
      return
    case 'skills':
      draft.skills = toBulletLines(cleanLines).map((name) => ({ name, progress: 0 }))
      return
    case 'languages':
      draft.languages = toBulletLines(cleanLines).map((name) => ({ name, progress: 0 }))
      return
    case 'interests':
      draft.interests = toBulletLines(cleanLines)
      return
    case 'certifications':
      draft.certifications = toBulletLines(cleanLines).map((title) => ({ title, issuer: '', year: '' }))
      return
    case 'education':
      draft.education = cleanLines.map((line) => ({
        degree: line,
        institution: '',
        startDate: '',
        endDate: '',
      }))
      return
    case 'projects':
      draft.projects = cleanLines.map((line) => ({
        title: line,
        description: '',
        github: '',
        liveDemo: '',
      }))
      return
    case 'workExperience':
      draft.workExperience = cleanLines.map((line) => ({
        company: '',
        role: line,
        startDate: '',
        endDate: '',
        description: '',
      }))
      return
    case 'contact':
      pushFreeBlock(draft, 'Contact', cleanLines)
      return
    default:
      pushFreeBlock(draft, currentSection, cleanLines)
  }
}

export const parseMarkdownResume = (rawText = '') => {
  const draft = defaultDraft()
  const normalized = rawText.replace(/\r\n/g, '\n')
  const lines = normalized.split('\n')
  const nonEmptyLines = lines.map((line) => normalizeLine(line)).filter(Boolean)
  const headings = []
  let currentSection = 'summary'
  let buffer = []

  if (nonEmptyLines[0]) {
    draft.profileInfo.fullName = nonEmptyLines[0].replace(/^#\s*/, '')
    draft.title = `${draft.profileInfo.fullName || 'Imported'} Resume`
  }

  if (nonEmptyLines[1] && !nonEmptyLines[1].startsWith('#') && !nonEmptyLines[1].startsWith('-')) {
    draft.profileInfo.designation = nonEmptyLines[1]
  }

  draft.contactInfo = {
    ...draft.contactInfo,
    ...extractContacts(rawText),
  }

  const flushBuffer = () => {
    if (!buffer.length) return
    parseNamedSection(draft, currentSection, buffer)
    buffer = []
  }

  lines.forEach((line, index) => {
    const cleanLine = normalizeLine(line)
    if (!cleanLine) {
      return
    }

    const headingMatch = cleanLine.match(/^#{1,3}\s+(.+)$/)
    if (headingMatch) {
      flushBuffer()
      const headingName = headingMatch[1].trim().toLowerCase()
      const mappedKey = sectionKeyMap[headingName] || headingName
      headings.push(headingName)
      currentSection = mappedKey
      return
    }

    if (index <= 1 && !headingMatch) {
      return
    }

    buffer.push(cleanLine)
  })

  flushBuffer()

  const unresolvedFields = []
  if (!draft.profileInfo.fullName) unresolvedFields.push('profileInfo.fullName')
  if (!draft.profileInfo.designation) unresolvedFields.push('profileInfo.designation')
  if (!draft.contactInfo.email) unresolvedFields.push('contactInfo.email')

  const fieldScores = {
    fullName: draft.profileInfo.fullName ? 0.95 : 0.1,
    designation: draft.profileInfo.designation ? 0.8 : 0.2,
    email: draft.contactInfo.email ? 0.95 : 0.2,
  }

  return {
    parsedSections: {
      headings,
      lineCount: lines.length,
    },
    mappedResumeDraft: draft,
    confidenceSummary: {
      ...summarizeConfidence(fieldScores),
      sectionsDetected: headings,
    },
    unresolvedFields,
  }
}
