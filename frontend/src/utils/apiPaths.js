// 生产环境默认走同域 API，方便单服务部署到 Render。
export const BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');

// routes used for frontend
export const API_PATHS = {

  AUTH: {
    REGISTER:'/api/auth/register',
    LOGIN: '/api/auth/login',
    GET_PROFILE: '/api/auth/profile',
  },
  RESUME: {
    CREATE: '/api/resume',
    GET_ALL: '/api/resume',
    GET_BY_ID: (id) => `/api/resume/${id}`,

    UPDATE: (id) => `/api/resume/${id}`,
    DELETE: (id) => `/api/resume/${id}`,
    UPLOAD_IMAGES: (id) => `/api/resume/${id}/upload-image`,
    GET_MARKDOWN: (id) => `/api/resume/${id}/markdown`,
    CREATE_MARKDOWN: (id) => `/api/resume/${id}/markdown`,
    UPDATE_MARKDOWN: (id) => `/api/resume/${id}/markdown`,
    SYNC_MARKDOWN_FROM_RESUME: (id) => `/api/resume/${id}/markdown/sync-from-resume`,
    PREVIEW_APPLY_MARKDOWN: (id) => `/api/resume/${id}/markdown/preview-apply`,
    APPLY_MARKDOWN_TO_RESUME: (id) => `/api/resume/${id}/markdown/apply-to-resume`,
    DELETE_MARKDOWN: (id) => `/api/resume/${id}/markdown`,
    EXPORT_MARKDOWN: (id) => `/api/resume/${id}/export/markdown`,
    CREATE_EXPORT_LOG: (id) => `/api/resume/${id}/exports/log`,
    GET_EXPORT_LOGS: (id) => `/api/resume/${id}/exports`,
    CREATE_SHARE: (id) => `/api/resume/${id}/share`,
    GET_SHARE: (id) => `/api/resume/${id}/share`,
    UPDATE_SHARE: (id) => `/api/resume/${id}/share`,
    TOGGLE_SHARE: (id) => `/api/resume/${id}/share/toggle`,
    CREATE_VERSION: (id) => `/api/resume/${id}/versions`,
    GET_VERSIONS: (id) => `/api/resume/${id}/versions`,
    GET_VERSION: (id, versionId) => `/api/resume/${id}/versions/${versionId}`,
    RESTORE_VERSION: (id, versionId) => `/api/resume/${id}/versions/${versionId}/restore`,
    DELETE_VERSION: (id, versionId) => `/api/resume/${id}/versions/${versionId}`,
  },
  JOBS: {
    CREATE: '/api/job-descriptions',
    GET_ALL: '/api/job-descriptions',
    GET_BY_ID: (id) => `/api/job-descriptions/${id}`,
    UPDATE: (id) => `/api/job-descriptions/${id}`,
    DELETE: (id) => `/api/job-descriptions/${id}`,
  },
  ATS: {
    ANALYZE: '/api/ats/analyze',
    DERIVE_RESUME: '/api/ats/derive-resume',
    GET_RECORD: (id) => `/api/ats/records/${id}`,
  },
  COVER_LETTERS: {
    CREATE: '/api/cover-letters',
    GENERATE: '/api/cover-letters/generate',
    GET_ALL: '/api/cover-letters',
    GET_BY_ID: (id) => `/api/cover-letters/${id}`,
    UPDATE: (id) => `/api/cover-letters/${id}`,
    DELETE: (id) => `/api/cover-letters/${id}`,
  },
  APPLICATIONS: {
    CREATE: '/api/applications',
    GET_ALL: '/api/applications',
    GET_BY_ID: (id) => `/api/applications/${id}`,
    UPDATE: (id) => `/api/applications/${id}`,
    DELETE: (id) => `/api/applications/${id}`,
    ADD_TIMELINE: (id) => `/api/applications/${id}/timeline`,
    STATS: '/api/applications/stats/summary',
  },
  IMPORTS: {
    CREATE: '/api/imports',
    CREATE_MARKDOWN: '/api/imports/markdown',
    CREATE_PDF: '/api/imports/pdf',
    GET_ALL: '/api/imports',
    GET_BY_ID: (id) => `/api/imports/${id}`,
    UPDATE: (id) => `/api/imports/${id}`,
    CONFIRM: (id) => `/api/imports/${id}/confirm`,
  },
  TEMPLATES: {
    GET_ALL: '/api/templates',
    GET_PREVIEW: (id) => `/api/templates/${id}/preview`,
    GET_BY_ID: (id) => `/api/templates/${id}`,
    CREATE: '/api/templates',
    UPDATE: (id) => `/api/templates/${id}`,
    TOGGLE_FAVORITE: (id) => `/api/templates/${id}/favorite`,
    DUPLICATE: (id) => `/api/templates/${id}/duplicate`,
    APPLY: (id) => `/api/templates/${id}/apply`,
  },
  PUBLIC: {
    GET_SHARE: (slug) => `/api/public/share/${slug}`,
  },
  image: {
    UPLOAD_IMAGE:'/api/auth/upload-image',
  }
}
