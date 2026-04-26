export const queryKeys = {
  profile: ['profile'],
  resumes: ['resumes'],
  resume: (resumeId) => ['resume', resumeId],
  resumeExportLogs: (resumeId) => ['resume', resumeId, 'export-logs'],
  resumeExportSummary: (resumeId) => ['resume', resumeId, 'export-summary'],
  resumeShare: (resumeId) => ['resume', resumeId, 'share'],
  templates: (filters) => ['templates', filters],
  template: (templateId) => ['template', templateId],
  templateReviewQueue: ['template-review-queue'],
  adminUsers: (filters) => ['admin-users', filters],
  adminUser: (userId) => ['admin-user', userId],
}
