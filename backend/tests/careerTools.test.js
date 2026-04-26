import request from 'supertest'
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import userRoutes from '../routes/userRoutes.js'
import resumeRoutes from '../routes/resumeRouter.js'
import templateRoutes from '../routes/templateRoutes.js'
import publicRoutes from '../routes/publicRoutes.js'
import adminRoutes from '../routes/adminRoutes.js'
import User from '../models/userModel.js'

const createTestApp = () => {
  const app = express()
  app.use(cors())
  app.use(express.json())
  app.use('/api/auth', userRoutes)
  app.use('/api/resume', resumeRoutes)
  app.use('/api/templates', templateRoutes)
  app.use('/api/public', publicRoutes)
  app.use('/api/admin', adminRoutes)

  return app
}

describe('Career Tools API Tests', () => {
  let app
  let authToken
  let adminToken
  let resumeId
  let versionId

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

    const adminRegisterResponse = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Career Tool Admin',
        email: `admin${Date.now()}@example.com`,
        password: 'password123',
      })

    await User.findByIdAndUpdate(adminRegisterResponse.body._id, {
      role: 'admin',
    })

    const adminLoginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: adminRegisterResponse.body.email,
        password: 'password123',
      })

    adminToken = adminLoginResponse.body.token

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

  it('should expose template metadata and apply a template to a resume', async () => {
    const templatesResponse = await request(app).get('/api/templates')
    expect(templatesResponse.status).toBe(200)
    expect(templatesResponse.body.length).toBeGreaterThan(0)
    expect(templatesResponse.body.some((template) => template.id === 'official-classic-professional')).toBe(true)
    expect(templatesResponse.body.find((template) => template.id === 'official-classic-professional').authorName).toBe('ResumeXpert')

    const templatePreviewResponse = await request(app).get('/api/templates/official-classic-professional/preview')
    expect(templatePreviewResponse.status).toBe(200)
    expect(templatePreviewResponse.body.id).toBe('official-classic-professional')

    const legacyTemplatePreviewResponse = await request(app).get('/api/templates/01/preview')
    expect(legacyTemplatePreviewResponse.status).toBe(200)
    expect(legacyTemplatePreviewResponse.body.id).toBe('official-classic-professional')

    const createTemplateResponse = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Private Custom Template',
        rendererKey: 'flex',
        sourceType: 'custom',
        category: 'general',
      })

    expect(createTemplateResponse.status).toBe(201)

    const customTemplateId = createTemplateResponse.body.id

    const anonymousCustomPreviewResponse = await request(app).get(`/api/templates/${customTemplateId}/preview`)
    expect(anonymousCustomPreviewResponse.status).toBe(404)

    const authenticatedCustomPreviewResponse = await request(app)
      .get(`/api/templates/${customTemplateId}/preview`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(authenticatedCustomPreviewResponse.status).toBe(200)
    expect(authenticatedCustomPreviewResponse.body.id).toBe(customTemplateId)
    expect(authenticatedCustomPreviewResponse.body.authorName).toBe('Career Tool User')

    const mineTemplatesResponse = await request(app)
      .get('/api/templates?scope=mine')
      .set('Authorization', `Bearer ${authToken}`)

    expect(mineTemplatesResponse.status).toBe(200)
    expect(mineTemplatesResponse.body.some((template) => template.id === customTemplateId)).toBe(true)

    const duplicateOfficialResponse = await request(app)
      .post('/api/templates/official-classic-professional/duplicate')
      .set('Authorization', `Bearer ${authToken}`)
      .send({})

    expect(duplicateOfficialResponse.status).toBe(201)
    expect(duplicateOfficialResponse.body.isOwned).toBe(true)

    const updateProfileResponse = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Career Tool User Updated',
      })

    expect(updateProfileResponse.status).toBe(200)

    const refreshedCustomTemplateResponse = await request(app)
      .get(`/api/templates/${customTemplateId}`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(refreshedCustomTemplateResponse.status).toBe(200)
    expect(refreshedCustomTemplateResponse.body.authorName).toBe('Career Tool User Updated')

    const applyTemplateResponse = await request(app)
      .post(`/api/templates/${customTemplateId}/apply`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        resumeId,
        themeSettings: {
          accentColor: '#111827',
        },
        layoutMode: 'two-column',
        blockConfig: [],
      })

    expect(applyTemplateResponse.status).toBe(200)
    expect(applyTemplateResponse.body.resume.template.templateId).toBe(customTemplateId)
  })

  it('should restrict review queue to admins and let admins review community templates', async () => {
    const templateResponse = await request(app)
      .post('/api/templates')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Community Candidate',
        rendererKey: 'flex',
        sourceType: 'custom',
        category: 'general',
      })

    const submitResponse = await request(app)
      .post(`/api/templates/${templateResponse.body.id}/submit-community`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        submitterNote: 'Please review this template',
      })

    expect(submitResponse.status).toBe(200)
    expect(submitResponse.body.communityMeta.reviewStatus).toBe('pending')

    const forbiddenQueueResponse = await request(app)
      .get('/api/templates/review-queue')
      .set('Authorization', `Bearer ${authToken}`)

    expect(forbiddenQueueResponse.status).toBe(403)

    const reviewQueueResponse = await request(app)
      .get('/api/templates/review-queue')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(reviewQueueResponse.status).toBe(200)
    expect(reviewQueueResponse.body.some((item) => item.id === templateResponse.body.id)).toBe(true)

    const reviewResponse = await request(app)
      .post(`/api/templates/${templateResponse.body.id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'approved',
        reviewNotes: 'Looks good',
      })

    expect(reviewResponse.status).toBe(200)
    expect(reviewResponse.body.communityMeta.reviewStatus).toBe('approved')
    expect(reviewResponse.body.communityMeta.reviewerName).toBe('Career Tool Admin')
  })

  it('should let admins manage users', async () => {
    const listResponse = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)

    expect(listResponse.status).toBe(200)
    expect(Array.isArray(listResponse.body)).toBe(true)
    expect(listResponse.body.length).toBeGreaterThan(0)

    const targetUser = listResponse.body.find((item) => item.email !== undefined && item.role === 'user')
    expect(targetUser).toBeDefined()

    const detailResponse = await request(app)
      .get(`/api/admin/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`)

    expect(detailResponse.status).toBe(200)
    expect(detailResponse.body.email).toBe(targetUser.email)

    const statusResponse = await request(app)
      .put(`/api/admin/users/${targetUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'disabled' })

    expect(statusResponse.status).toBe(200)
    expect(statusResponse.body.status).toBe('disabled')

    const passwordResetResponse = await request(app)
      .post(`/api/admin/users/${targetUser._id}/password-reset`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ newPassword: 'newpass123' })

    expect(passwordResetResponse.status).toBe(200)
    expect(passwordResetResponse.body.message).toBe('Password reset successfully')
  })

  it('should enforce password protected share governance and expose export summary', async () => {
    const shareCreateResponse = await request(app)
      .post(`/api/resume/${resumeId}/share`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Governed Share',
        visibility: 'password',
        accessCode: 'secret-123',
        maxViewLimit: 1,
        triggerSource: 'test',
      })

    expect(shareCreateResponse.status).toBe(201)
    expect(shareCreateResponse.body.visibility).toBe('password')

    const unauthorizedPublicResponse = await request(app)
      .get(`/api/public/share/${shareCreateResponse.body.slug}`)

    expect(unauthorizedPublicResponse.status).toBe(401)

    const authorizedPublicResponse = await request(app)
      .get(`/api/public/share/${shareCreateResponse.body.slug}`)
      .set('x-share-access-code', 'secret-123')

    expect(authorizedPublicResponse.status).toBe(200)

    const limitedPublicResponse = await request(app)
      .get(`/api/public/share/${shareCreateResponse.body.slug}`)
      .set('x-share-access-code', 'secret-123')

    expect(limitedPublicResponse.status).toBe(410)

    const exportSummaryResponse = await request(app)
      .get(`/api/resume/${resumeId}/exports/summary`)
      .set('Authorization', `Bearer ${authToken}`)

    expect(exportSummaryResponse.status).toBe(200)
    expect(exportSummaryResponse.body.shareGovernance.visibility).toBe('password')
    expect(exportSummaryResponse.body.shareGovernance.statusReason).toBe('view_limit_reached')
  })
})
