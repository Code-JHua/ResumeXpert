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
  },
  image: {
    UPLOAD_IMAGE:'/api/auth/upload-image',
  }
}
