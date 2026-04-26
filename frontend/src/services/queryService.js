import axiosInstance from '../utils/axiosInstance'
import { API_PATHS } from '../utils/apiPaths'

const buildQuerySuffix = (filters = {}) => {
  const query = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, value)
    }
  })

  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export const fetchProfile = async () => {
  const response = await axiosInstance.get(API_PATHS.AUTH.GET_PROFILE)
  return response.data
}

export const fetchResumes = async () => {
  const response = await axiosInstance.get(API_PATHS.RESUME.GET_ALL)
  return response.data || []
}

export const fetchResumeById = async (resumeId) => {
  const response = await axiosInstance.get(API_PATHS.RESUME.GET_BY_ID(resumeId))
  return response.data
}

export const fetchResumeExportLogs = async (resumeId) => {
  const response = await axiosInstance.get(API_PATHS.RESUME.GET_EXPORT_LOGS(resumeId))
  return response.data || []
}

export const fetchResumeExportSummary = async (resumeId) => {
  const response = await axiosInstance.get(API_PATHS.RESUME.GET_EXPORT_SUMMARY(resumeId))
  return response.data || null
}

export const fetchResumeShare = async (resumeId) => {
  try {
    const response = await axiosInstance.get(API_PATHS.RESUME.GET_SHARE(resumeId))
    return response.data
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }

    throw error
  }
}

export const fetchTemplates = async (filters = {}) => {
  const response = await axiosInstance.get(`${API_PATHS.TEMPLATES.GET_ALL}${buildQuerySuffix(filters)}`)
  return response.data || []
}

export const fetchTemplateById = async (templateId) => {
  const response = await axiosInstance.get(API_PATHS.TEMPLATES.GET_BY_ID(templateId))
  return response.data
}

export const fetchTemplateReviewQueue = async (filters = {}) => {
  const response = await axiosInstance.get(`${API_PATHS.TEMPLATES.GET_REVIEW_QUEUE}${buildQuerySuffix(filters)}`)
  return response.data || []
}

export const fetchAdminUsers = async (filters = {}) => {
  const response = await axiosInstance.get(`${API_PATHS.ADMIN.GET_USERS}${buildQuerySuffix(filters)}`)
  return response.data || []
}

export const fetchAdminUserById = async (userId) => {
  const response = await axiosInstance.get(API_PATHS.ADMIN.GET_USER_BY_ID(userId))
  return response.data
}
