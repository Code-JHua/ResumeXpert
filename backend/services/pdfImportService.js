import { PDFParse } from 'pdf-parse'

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

const defaultDraft = () => ({
  title: 'Imported PDF Resume',
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

const sectionNames = [
  'summary',
  'professional summary',
  'experience',
  'work experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'interests',
]

export const extractPdfText = async (base64Content) => {
  const buffer = Buffer.from(base64Content, 'base64')
  const parser = new PDFParse({ data: buffer })

  try {
    const result = await parser.getText()
    return {
      rawText: result.text || '',
      metadata: {
        pageCount: result.pages?.length || 0,
        info: result.info || {},
      },
    }
  } finally {
    await parser.destroy()
  }
}

export const mapPdfTextToResumeDraft = (rawText = '') => {
  const draft = defaultDraft()
  const lines = rawText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  const normalizedLines = lines.map((line) => line.toLowerCase())

  if (lines[0]) {
    draft.profileInfo.fullName = lines[0]
    draft.title = `${lines[0]} Resume`
  }
  if (lines[1] && !sectionNames.includes(lines[1].toLowerCase())) {
    draft.profileInfo.designation = lines[1]
  }

  draft.contactInfo = {
    ...draft.contactInfo,
    ...extractContacts(rawText),
  }

  const normalizedText = rawText.toLowerCase()
  if (normalizedText.includes('summary')) {
    const summaryIndex = lines.findIndex((line) => line.toLowerCase() === 'summary' || line.toLowerCase() === 'professional summary')
    if (summaryIndex >= 0) {
      draft.profileInfo.summary = lines.slice(summaryIndex + 1, summaryIndex + 4).join(' ')
    }
  }

  if (normalizedText.includes('skills')) {
    const skillIndex = lines.findIndex((line) => line.toLowerCase() === 'skills')
    if (skillIndex >= 0) {
      draft.skills = lines
        .slice(skillIndex + 1, skillIndex + 8)
        .filter((line) => !sectionNames.includes(line.toLowerCase()))
        .map((name) => ({ name: name.replace(/^[-*]\s*/, ''), progress: 0 }))
    }
  }

  const educationIndex = normalizedLines.findIndex((line) => line === 'education')
  if (educationIndex >= 0) {
    draft.education = lines
      .slice(educationIndex + 1, educationIndex + 4)
      .filter((line) => !sectionNames.includes(line.toLowerCase()))
      .map((line) => ({
        degree: line.replace(/^[-*]\s*/, ''),
        institution: '',
        startDate: '',
        endDate: '',
      }))
  }

  const experienceIndex = normalizedLines.findIndex((line) => line === 'experience' || line === 'work experience')
  if (experienceIndex >= 0) {
    draft.workExperience = lines
      .slice(experienceIndex + 1, experienceIndex + 5)
      .filter((line) => !sectionNames.includes(line.toLowerCase()))
      .map((line) => ({
        role: line.replace(/^[-*]\s*/, ''),
        company: '',
        startDate: '',
        endDate: '',
        description: '',
      }))
  }

  draft.freeBlocks.push({
    type: 'pdf_text',
    title: 'Extracted PDF Content',
    content: rawText.slice(0, 4000),
    source: 'pdf',
  })

  const unresolvedFields = []
  if (!draft.profileInfo.fullName) unresolvedFields.push('profileInfo.fullName')
  if (!draft.profileInfo.designation) unresolvedFields.push('profileInfo.designation')
  if (!draft.contactInfo.email) unresolvedFields.push('contactInfo.email')

  const fieldScores = {
    fullName: draft.profileInfo.fullName ? 0.75 : 0.1,
    designation: draft.profileInfo.designation ? 0.55 : 0.2,
    email: draft.contactInfo.email ? 0.95 : 0.2,
    skills: draft.skills.length > 0 ? 0.7 : 0.25,
    workExperience: draft.workExperience.length > 0 ? 0.6 : 0.25,
    education: draft.education.length > 0 ? 0.6 : 0.25,
  }

  return {
    mappedResumeDraft: draft,
    confidenceSummary: summarizeConfidence(fieldScores),
    unresolvedFields,
  }
}
