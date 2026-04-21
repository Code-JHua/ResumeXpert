import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'

const buildBulletParagraphs = (items = []) =>
  items
    .filter(Boolean)
    .map((item) => new Paragraph({
      text: item,
      bullet: { level: 0 },
      spacing: { after: 120 },
    }))

const buildSectionHeading = (title) => new Paragraph({
  text: title,
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 240, after: 120 },
})

export const buildResumeDocxBuffer = async (resume) => {
  const sections = []
  const profile = resume.profileInfo || {}
  const contact = resume.contactInfo || {}

  sections.push(
    new Paragraph({
      text: profile.fullName || resume.title || 'Resume',
      heading: HeadingLevel.TITLE,
      spacing: { after: 120 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: profile.designation || '', bold: true }),
      ],
      spacing: { after: 120 },
    }),
    new Paragraph({
      text: [contact.email, contact.phone, contact.location].filter(Boolean).join(' | '),
      spacing: { after: 160 },
    }),
  )

  if (profile.summary) {
    sections.push(
      buildSectionHeading('个人总结'),
      new Paragraph({ text: profile.summary, spacing: { after: 160 } }),
    )
  }

  if (resume.workExperience?.length) {
    sections.push(buildSectionHeading('工作经历'))
    resume.workExperience.forEach((item) => {
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${item.role || ''} ${item.company ? `· ${item.company}` : ''}`.trim(), bold: true }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: [item.startDate, item.endDate].filter(Boolean).join(' - '),
          spacing: { after: 80 },
        }),
        ...buildBulletParagraphs((item.description || '').split(/\r?\n/).filter(Boolean)),
      )
    })
  }

  if (resume.projects?.length) {
    sections.push(buildSectionHeading('项目经历'))
    resume.projects.forEach((item) => {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: item.title || '', bold: true })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: item.description || '',
          spacing: { after: 80 },
        }),
      )
    })
  }

  if (resume.education?.length) {
    sections.push(buildSectionHeading('教育经历'))
    resume.education.forEach((item) => {
      sections.push(
        new Paragraph({
          text: [item.degree, item.institution].filter(Boolean).join(' · '),
          spacing: { after: 80 },
        }),
      )
    })
  }

  if (resume.skills?.length) {
    sections.push(
      buildSectionHeading('技能标签'),
      new Paragraph({
        text: resume.skills.map((item) => item.name).filter(Boolean).join('、'),
        spacing: { after: 120 },
      }),
    )
  }

  if (resume.certifications?.length) {
    sections.push(buildSectionHeading('证书资质'))
    resume.certifications.forEach((item) => {
      sections.push(new Paragraph({
        text: [item.title, item.issuer, item.year].filter(Boolean).join(' · '),
        spacing: { after: 80 },
      }))
    })
  }

  if (resume.languages?.length) {
    sections.push(
      buildSectionHeading('语言能力'),
      new Paragraph({
        text: resume.languages.map((item) => item.name).filter(Boolean).join('、'),
        spacing: { after: 120 },
      }),
    )
  }

  if (resume.interests?.length) {
    sections.push(
      buildSectionHeading('兴趣方向'),
      new Paragraph({
        text: resume.interests.filter(Boolean).join('、'),
        spacing: { after: 120 },
      }),
    )
  }

  if (resume.freeBlocks?.length) {
    sections.push(buildSectionHeading('补充信息'))
    resume.freeBlocks.forEach((item) => {
      sections.push(
        new Paragraph({
          children: [new TextRun({ text: item.title || '附加内容', bold: true })],
          spacing: { after: 80 },
        }),
        new Paragraph({
          text: item.content || '',
          spacing: { after: 120 },
        }),
      )
    })
  }

  const doc = new Document({
    sections: [
      {
        children: sections,
      },
    ],
  })

  return Packer.toBuffer(doc)
}
