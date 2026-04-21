import request from 'supertest'
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import userRoutes from '../routes/userRoutes.js'
import resumeRoutes from '../routes/resumeRouter.js'
import jobDescriptionRoutes from '../routes/jobDescriptionRoutes.js'
import atsRoutes from '../routes/atsRoutes.js'
import coverLetterRoutes from '../routes/coverLetterRoutes.js'
import applicationRoutes from '../routes/applicationRoutes.js'
import resumeImportRoutes from '../routes/resumeImportRoutes.js'
import templateRoutes from '../routes/templateRoutes.js'
import publicRoutes from '../routes/publicRoutes.js'

const createTestApp = () => {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api/auth', userRoutes)
  app.use('/api/resume', resumeRoutes)
  app.use('/api/job-descriptions', jobDescriptionRoutes)
  app.use('/api/ats', atsRoutes)
  app.use('/api/cover-letters', coverLetterRoutes)
  app.use('/api/applications', applicationRoutes)
  app.use('/api/imports', resumeImportRoutes)
  app.use('/api/templates', templateRoutes)
  app.use('/api/public', publicRoutes)

  return app
}

describe('Career Tools API Tests', () => {
  let app
  let authToken
  let resumeId
  let jobDescriptionId
  let versionId
  let coverLetterId
  let applicationId

  beforeAll(async () => {
    app = createTestApp()
  })

  beforeEach(async () => {
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Career Tool User',
        email: `career${Date.now()}@example.com`,
        password: 'password123',
      })

    authToken = registerResponse.body.token

    const resumeResponse = await request(app)
      .post('/api/resume')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Frontend Engineer Resume',
        profileInfo: {
          fullName: 'Career User',
          designation: 'Frontend Engineer',
          summary: 'React developer with strong Node.js collaboration experience',
        },
        skills: [{ name: 'React', progress: 80 }, { name: 'Node.js', progress: 70 }],
        projects: [{ title: 'ATS Tool', description: 'Built a React and Node.js project', github: '', liveDemo: '' }],
      })

    resumeId = resumeResponse.body._id
  })

  it('should manage job descriptions and run ATS analysis', async () => {
    const createResponse = await request(app)
      .post('/api/job-descriptions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Frontend Engineer',
        company: 'Example Inc',
        sourceText: 'Looking for a React engineer with Node.js, testing and communication skills.',
      })

    expect(createResponse.status).toBe(201)
    expect(createResponse.body.keywords.length).toBeGreaterThan(0)
    jobDescriptionId = createResponse.body._id

    const analysisResponse = await request(app)
      .post('/api/ats/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        resumeId,
        jobDescriptionId,
      })

    expect(analysisResponse.status).toBe(200)
    expect(analysisResponse.body.analysisRecordId).toBeDefined()
    expect(analysisResponse.body).toHaveProperty('overallScore')
    expect(Array.isArray(analysisResponse.body.recommendations)).toBe(true)
  })

  it('should derive a job-specific resume from an ATS analysis record', async () => {
    const createJobResponse = await request(app)
      .post('/api/job-descriptions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Senior Frontend Engineer',
        company: 'Career Labs',
        sourceText: 'Need React, Node.js, TypeScript and communication for cross-functional product work.',
      })

    jobDescriptionId = createJobResponse.body._id

    const analyzeResponse = await request(app)
      .post('/api/ats/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        resumeId,
        jobDescriptionId,
      })

    expect(analyzeResponse.status).toBe(200)
    expect(analyzeResponse.body.analysisRecordId).toBeDefined()

    const deriveResponse = await request(app)
      .post('/api/ats/derive-resume')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        resumeId,
        jobDescriptionId,
        analysisRecordId: analyzeResponse.body.analysisRecordId,
      })

    expect(deriveResponse.status).toBe(201)
    expect(deriveResponse.body.resume.derivedFromResumeId.toString()).toBe(resumeId)
    expect(deriveResponse.body.resume.targetJobDescriptionId.toString()).toBe(jobDescriptionId)
    expect(deriveResponse.body.version.sourceType).toBe('derived')
    expect(deriveResponse.body.analysisRecordId).toBe(analyzeResponse.body.analysisRecordId)
  })

  it('should create, list, restore and delete resume versions', async () => {
    const versionResponse = await request(app)
      .post(`/api/resume/${resumeId}/versions`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        versionName: '投递版 V1',
        note: '初始投递版本',
      })

    expect(versionResponse.status).toBe(201)
    versionId = versionResponse.body._id

    const versionsResponse = await request(app)
      .get(`/api/resume/${resumeId}/versions`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(versionsResponse.status).toBe(200)
    expect(versionsResponse.body.length).toBe(1)

    await request(app)
      .put(`/api/resume/${resumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Changed Title',
      })

    const restoreResponse = await request(app)
      .post(`/api/resume/${resumeId}/versions/${versionId}/restore`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(restoreResponse.status).toBe(200)
    expect(restoreResponse.body.title).toBe('Frontend Engineer Resume')

    const deleteResponse = await request(app)
      .delete(`/api/resume/${resumeId}/versions/${versionId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(deleteResponse.status).toBe(200)
  })

  it('should manage markdown documents, export logs, and placeholder markdown export', async () => {
    const createMarkdownResponse = await request(app)
      .post(`/api/resume/${resumeId}/markdown`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Frontend Engineer Markdown',
        content: '# Frontend Engineer Resume',
        parsedStructuredSnapshot: {
          title: 'Frontend Engineer Resume',
        },
        syncStatus: 'synced',
      })

    expect(createMarkdownResponse.status).toBe(201)

    const getMarkdownResponse = await request(app)
      .get(`/api/resume/${resumeId}/markdown`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(getMarkdownResponse.status).toBe(200)
    expect(getMarkdownResponse.body.content).toContain('Frontend Engineer Resume')

    const updateMarkdownResponse = await request(app)
      .put(`/api/resume/${resumeId}/markdown`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: '# Updated Frontend Engineer Resume',
        syncStatus: 'outdated',
      })

    expect(updateMarkdownResponse.status).toBe(200)
    expect(updateMarkdownResponse.body.syncStatus).toBe('outdated')

    const exportMarkdownResponse = await request(app)
      .get(`/api/resume/${resumeId}/export/markdown`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(exportMarkdownResponse.status).toBe(200)
    expect(exportMarkdownResponse.body.status).toBe('ready')

    const exportLogResponse = await request(app)
      .post(`/api/resume/${resumeId}/exports/log`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        format: 'pdf',
        templateId: '01',
        status: 'success',
      })

    expect(exportLogResponse.status).toBe(201)

    const getExportLogsResponse = await request(app)
      .get(`/api/resume/${resumeId}/exports`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(getExportLogsResponse.status).toBe(200)
    expect(getExportLogsResponse.body.length).toBe(1)
    expect(getExportLogsResponse.body[0].metadata.triggerSource).toBe('unknown')
  })

  it('should create, publish, toggle and expose public share pages', async () => {
    const createShareResponse = await request(app)
      .post(`/api/resume/${resumeId}/share`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Frontend Resume Public Share',
        triggerSource: 'share_management',
      })

    expect(createShareResponse.status).toBe(201)
    expect(createShareResponse.body.isEnabled).toBe(true)
    expect(createShareResponse.body.slug).toBeDefined()

    const shareDetailResponse = await request(app)
      .get(`/api/resume/${resumeId}/share`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(shareDetailResponse.status).toBe(200)
    expect(shareDetailResponse.body.status).toBe('published')

    const publicShareResponse = await request(app)
      .get(`/api/public/share/${createShareResponse.body.slug}`)
      .set('User-Agent', 'career-tools-test')

    expect(publicShareResponse.status).toBe(200)
    expect(publicShareResponse.body.resume.title).toBe('Frontend Engineer Resume')
    expect(publicShareResponse.body.viewCount).toBe(1)
    expect(publicShareResponse.body.uniqueVisitorCount).toBe(1)

    const disableShareResponse = await request(app)
      .post(`/api/resume/${resumeId}/share/toggle`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        isEnabled: false,
        triggerSource: 'share_management',
      })

    expect(disableShareResponse.status).toBe(200)
    expect(disableShareResponse.body.isEnabled).toBe(false)

    const closedPublicShareResponse = await request(app)
      .get(`/api/public/share/${createShareResponse.body.slug}`)

    expect(closedPublicShareResponse.status).toBe(404)
  })

  it('should mark markdown document outdated after structured resume updates', async () => {
    const createMarkdownResponse = await request(app)
      .post(`/api/resume/${resumeId}/markdown`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Sync Resume Markdown',
        content: '# Career User',
        parsedStructuredSnapshot: {
          title: 'Frontend Engineer Resume',
        },
        syncStatus: 'synced',
        lastSyncedAt: '2026-04-21T10:00:00.000Z',
      })

    expect(createMarkdownResponse.status).toBe(201)

    const updateResumeResponse = await request(app)
      .put(`/api/resume/${resumeId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        profileInfo: {
          summary: 'Updated from structured editor.',
        },
      })

    expect(updateResumeResponse.status).toBe(200)

    const markdownResponse = await request(app)
      .get(`/api/resume/${resumeId}/markdown`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(markdownResponse.status).toBe(200)
    expect(markdownResponse.body.syncStatus).toBe('outdated')
  })

  it('should sync markdown from resume and apply markdown back to structured resume', async () => {
    const syncResponse = await request(app)
      .post(`/api/resume/${resumeId}/markdown/sync-from-resume`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({})

    expect(syncResponse.status).toBe(200)
    expect(syncResponse.body.content).toContain('Career User')
    expect(syncResponse.body.document.syncStatus).toBe('synced')

    const applyResponse = await request(app)
      .post(`/api/resume/${resumeId}/markdown/apply-to-resume`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Updated Resume Markdown',
        content: [
          '# Career User',
          'Staff Frontend Engineer',
          '',
          '## Summary',
          'Builds resume workflows with React and Node.js.',
          '',
          '## Skills',
          '- React',
          '- TypeScript',
          '',
          '## Awards',
          'Hackathon Winner',
          '',
          'career@example.com',
        ].join('\n'),
      })

    expect(applyResponse.status).toBe(200)
    expect(applyResponse.body.resume.profileInfo.designation).toBe('Staff Frontend Engineer')
    expect(applyResponse.body.resume.skills[1].name).toBe('TypeScript')
    expect(applyResponse.body.resume.freeBlocks[0].title).toBe('awards')

    const updatedResumeResponse = await request(app)
      .get(`/api/resume/${resumeId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(updatedResumeResponse.status).toBe(200)
    expect(updatedResumeResponse.body.profileInfo.designation).toBe('Staff Frontend Engineer')
    expect(updatedResumeResponse.body.contactInfo.email).toBe('career@example.com')
    expect(updatedResumeResponse.body.freeBlocks.length).toBeGreaterThan(0)
  })

  it('should preview markdown apply changes before overwriting resume', async () => {
    const previewResponse = await request(app)
      .post(`/api/resume/${resumeId}/markdown/preview-apply`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        content: [
          '# Career User',
          'Principal Frontend Engineer',
          '',
          '## Summary',
          'Builds structured and markdown resume flows.',
          '',
          'preview@example.com',
        ].join('\n'),
      })

    expect(previewResponse.status).toBe(200)
    expect(Array.isArray(previewResponse.body.overwriteSummary)).toBe(true)
    expect(previewResponse.body.overwriteSummary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'profileInfo.designation', nextValue: 'Principal Frontend Engineer' }),
        expect.objectContaining({ field: 'contactInfo.email', nextValue: 'preview@example.com' }),
      ])
    )
  })

  it('should manage imports and expose template metadata', async () => {
    const createImportResponse = await request(app)
      .post('/api/imports')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        sourceType: 'markdown',
        originalFileName: 'resume.md',
        rawText: '# Resume',
        status: 'needs_confirmation',
      })

    expect(createImportResponse.status).toBe(201)

    const importId = createImportResponse.body._id

    const updateImportResponse = await request(app)
      .put(`/api/imports/${importId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        status: 'confirmed',
        manualCorrections: [{ field: 'profileInfo.fullName', value: 'Career User' }],
      })

    expect(updateImportResponse.status).toBe(200)
    expect(updateImportResponse.body.status).toBe('confirmed')

    const getImportResponse = await request(app)
      .get(`/api/imports/${importId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(getImportResponse.status).toBe(200)
    expect(getImportResponse.body.manualCorrections.length).toBe(1)

    const templatesResponse = await request(app).get('/api/templates')
    expect(templatesResponse.status).toBe(200)
    expect(templatesResponse.body.length).toBeGreaterThan(0)

    const templatePreviewResponse = await request(app).get('/api/templates/01/preview')
    expect(templatePreviewResponse.status).toBe(200)
    expect(templatePreviewResponse.body.id).toBe('01')
  })

  it('should import markdown and confirm it into a resume', async () => {
    const createImportResponse = await request(app)
      .post('/api/imports/markdown')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        originalFileName: 'candidate.md',
        rawText: [
          '# Jane Import',
          'Frontend Engineer',
          '',
          '## Summary',
          'React developer with product thinking.',
          '',
          '## Skills',
          '- React',
          '- Node.js',
          '',
          'jane@example.com',
        ].join('\n'),
      })

    expect(createImportResponse.status).toBe(201)
    expect(createImportResponse.body.status).toBe('needs_confirmation')
    expect(createImportResponse.body.mappedResumeDraft.profileInfo.fullName).toBe('Jane Import')

    const confirmResponse = await request(app)
      .put(`/api/imports/${createImportResponse.body._id}/confirm`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        mappedResumeDraft: {
          ...createImportResponse.body.mappedResumeDraft,
          profileInfo: {
            ...createImportResponse.body.mappedResumeDraft.profileInfo,
            designation: 'Senior Frontend Engineer',
          },
        },
        manualCorrections: [{ field: 'profileInfo.designation', value: 'Senior Frontend Engineer' }],
      })

    expect(confirmResponse.status).toBe(200)
    expect(confirmResponse.body.status).toBe('confirmed')
    expect(confirmResponse.body.resumeId).toBeDefined()
    expect(confirmResponse.body.markdownDocumentId).toBeDefined()

    const resumeResponse = await request(app)
      .get(`/api/resume/${confirmResponse.body.resumeId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(resumeResponse.status).toBe(200)
    expect(resumeResponse.body.contentSource).toBe('markdown')
    expect(resumeResponse.body.sourceImportId).toBe(createImportResponse.body._id)
  })

  it('should preserve original nested fields when confirm overrides only part of the draft', async () => {
    const createImportResponse = await request(app)
      .post('/api/imports/markdown')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        originalFileName: 'partial.md',
        rawText: [
          '# Alex Import',
          'Product Engineer',
          '',
          'alex@example.com',
        ].join('\n'),
      })

    expect(createImportResponse.status).toBe(201)

    const confirmResponse = await request(app)
      .put(`/api/imports/${createImportResponse.body._id}/confirm`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        mappedResumeDraft: {
          profileInfo: {
            designation: 'Senior Product Engineer',
          },
        },
        manualCorrections: [{ field: 'profileInfo.designation', value: 'Senior Product Engineer' }],
      })

    expect(confirmResponse.status).toBe(200)

    const resumeResponse = await request(app)
      .get(`/api/resume/${confirmResponse.body.resumeId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(resumeResponse.status).toBe(200)
    expect(resumeResponse.body.profileInfo.fullName).toBe('Alex Import')
    expect(resumeResponse.body.profileInfo.designation).toBe('Senior Product Engineer')
  })

  it('should reject invalid pdf imports with a failed import record', async () => {
    const pdfImportResponse = await request(app)
      .post('/api/imports/pdf')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        originalFileName: 'broken.pdf',
        base64Content: 'not-a-real-pdf',
      })

    expect(pdfImportResponse.status).toBe(422)
    expect(pdfImportResponse.body.importId).toBeDefined()

    const failedImportResponse = await request(app)
      .get(`/api/imports/${pdfImportResponse.body.importId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(failedImportResponse.status).toBe(200)
    expect(failedImportResponse.body.status).toBe('failed')
    expect(failedImportResponse.body.failureReason).toBeTruthy()
  })

  it('should generate cover letters and manage applications', async () => {
    const jobResponse = await request(app)
      .post('/api/job-descriptions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Full Stack Engineer',
        company: 'Hiring Co',
        sourceText: 'Need React, Node.js and team communication experience for product development.',
      })
    jobDescriptionId = jobResponse.body._id

    const versionResponse = await request(app)
      .post(`/api/resume/${resumeId}/versions`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ versionName: '全栈投递版' })
    versionId = versionResponse.body._id

    const coverLetterResponse = await request(app)
      .post('/api/cover-letters/generate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        resumeId,
        resumeVersionId: versionId,
        jobDescriptionId,
        sourceAnalysisId: '6805a2d5d4f8b9c4a1234567',
        title: 'Hiring Co 求职信',
      })

    expect(coverLetterResponse.status).toBe(201)
    expect(coverLetterResponse.body.content).toContain('尊敬的招聘团队')
    expect(coverLetterResponse.body.resumeVersionId._id || coverLetterResponse.body.resumeVersionId).toBeDefined()
    coverLetterId = coverLetterResponse.body._id

    const applicationResponse = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        company: 'Hiring Co',
        position: 'Full Stack Engineer',
        resumeId,
        resumeVersionId: versionId,
        jobDescriptionId,
        coverLetterId,
        sourceAnalysisId: '6805a2d5d4f8b9c4a1234567',
        status: 'applied',
        appliedAt: '2026-04-21T10:00:00.000Z',
        nextActionAt: '2026-04-25T10:00:00.000Z',
        notes: '等待一面通知',
      })

    expect(applicationResponse.status).toBe(201)
    expect(applicationResponse.body.timeline.length).toBeGreaterThan(1)
    applicationId = applicationResponse.body._id

    const timelineResponse = await request(app)
      .post(`/api/applications/${applicationId}/timeline`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'first_interview',
        title: '一面',
        time: '2026-04-26T09:00:00.000Z',
        description: '技术面试',
        status: 'first_interview',
      })

    expect(timelineResponse.status).toBe(200)
    expect(timelineResponse.body.timeline.length).toBeGreaterThan(1)

    const statsResponse = await request(app)
      .get('/api/applications/stats/summary')
      .set('Authorization', `Bearer ${authToken}`)

    expect(statsResponse.status).toBe(200)
    expect(statsResponse.body.total).toBe(1)
    expect(statsResponse.body.calendarItems.length).toBeGreaterThan(0)
  })
})
