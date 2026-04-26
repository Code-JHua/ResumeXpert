// 生产环境默认走同域 API，方便单服务部署到 Render。
export const BASE_URL =
  import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:4000');

// routes used for frontend
export const API_PATHS = {

  AUTH: {
    REGISTER:'/api/auth/register',
    LOGIN: '/api/auth/login',
    GET_PROFILE: '/api/auth/profile',
    UPDATE_PROFILE: '/api/auth/profile',
    UPDATE_PASSWORD: '/api/auth/password',
  },
  ADMIN: {
    GET_USERS: '/api/admin/users',
    GET_USER_BY_ID: (id) => `/api/admin/users/${id}`,
    UPDATE_USER_STATUS: (id) => `/api/admin/users/${id}/status`,
    RESET_USER_PASSWORD: (id) => `/api/admin/users/${id}/password-reset`,
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
    EXPORT_DOCX: (id) => `/api/resume/${id}/export/docx`,
    CREATE_EXPORT_LOG: (id) => `/api/resume/${id}/exports/log`,
    GET_EXPORT_LOGS: (id) => `/api/resume/${id}/exports`,
    GET_EXPORT_SUMMARY: (id) => `/api/resume/${id}/exports/summary`,
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
  TEMPLATES: {
    GET_ALL: '/api/templates',
    GET_PREVIEW: (id) => `/api/templates/${id}/preview`,
    GET_BY_ID: (id) => `/api/templates/${id}`,
    CREATE: '/api/templates',
    UPDATE: (id) => `/api/templates/${id}`,
    DELETE: (id) => `/api/templates/${id}`,
    GET_REVIEW_QUEUE: '/api/templates/review-queue',
    TOGGLE_FAVORITE: (id) => `/api/templates/${id}/favorite`,
    DUPLICATE: (id) => `/api/templates/${id}/duplicate`,
    APPLY: (id) => `/api/templates/${id}/apply`,
    SUBMIT_COMMUNITY: (id) => `/api/templates/${id}/submit-community`,
    REVIEW: (id) => `/api/templates/${id}/review`,
  },
  PUBLIC: {
    GET_SHARE: (slug) => `/api/public/share/${slug}`,
  },
  image: {
    UPLOAD_IMAGE:'/api/auth/upload-image',
  }
}
