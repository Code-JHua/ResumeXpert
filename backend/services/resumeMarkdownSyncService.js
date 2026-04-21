export const buildMarkdownFromResume = (resume) => {
  if (!resume) return ''

  const lines = []
  if (resume.profileInfo?.fullName) lines.push(`# ${resume.profileInfo.fullName}`)
  if (resume.profileInfo?.designation) lines.push(resume.profileInfo.designation)
  lines.push('')

  if (resume.profileInfo?.summary) {
    lines.push('## Summary')
    lines.push(resume.profileInfo.summary)
    lines.push('')
  }

  const contactLines = [
    resume.contactInfo?.email,
    resume.contactInfo?.phone,
    resume.contactInfo?.location,
    resume.contactInfo?.linkedin,
    resume.contactInfo?.github,
    resume.contactInfo?.website,
  ].filter(Boolean)

  if (contactLines.length) {
    lines.push('## Contact')
    contactLines.forEach((line) => lines.push(`- ${line}`))
    lines.push('')
  }

  if (resume.workExperience?.length) {
    lines.push('## Work Experience')
    resume.workExperience.forEach((item) => {
      const title = [item.role, item.company].filter(Boolean).join(' @ ')
      if (title) lines.push(`- ${title}`)
      if (item.description) lines.push(`  ${item.description}`)
      if (item.startDate || item.endDate) {
        lines.push(`  ${[item.startDate, item.endDate].filter(Boolean).join(' - ')}`)
      }
    })
    lines.push('')
  }

  if (resume.education?.length) {
    lines.push('## Education')
    resume.education.forEach((item) => {
      const title = [item.degree, item.institution].filter(Boolean).join(' - ')
      if (title) lines.push(`- ${title}`)
      if (item.startDate || item.endDate) {
        lines.push(`  ${[item.startDate, item.endDate].filter(Boolean).join(' - ')}`)
      }
    })
    lines.push('')
  }

  if (resume.skills?.length) {
    lines.push('## Skills')
    resume.skills.forEach((skill) => {
      if (skill.name) lines.push(`- ${skill.name}`)
    })
    lines.push('')
  }

  if (resume.projects?.length) {
    lines.push('## Projects')
    resume.projects.forEach((project) => {
      if (project.title) lines.push(`- ${project.title}`)
      if (project.description) lines.push(`  ${project.description}`)
    })
    lines.push('')
  }

  if (resume.freeBlocks?.length) {
    resume.freeBlocks.forEach((block) => {
      if (!block?.content) return
      lines.push(`## ${block.title || 'Additional'}`)
      lines.push(block.content)
      lines.push('')
    })
  }

  return lines.join('\n').trim()
}

export const buildStructuredSnapshot = (resume) => ({
  title: resume?.title || '',
  profileInfo: resume?.profileInfo || {},
  contactInfo: resume?.contactInfo || {},
  workExperience: resume?.workExperience || [],
  education: resume?.education || [],
  skills: resume?.skills || [],
  projects: resume?.projects || [],
  certifications: resume?.certifications || [],
  languages: resume?.languages || [],
  interests: resume?.interests || [],
  freeBlocks: resume?.freeBlocks || [],
})
