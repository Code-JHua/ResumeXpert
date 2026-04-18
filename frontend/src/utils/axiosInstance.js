import axios from 'axios';
import { BASE_URL } from './apiPaths.js';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

//request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('token');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Check if error.response exists before accessing its properties
    // This prevents TypeError when error.response is undefined (network errors, timeouts, etc.)
    if (error.response) {
      if (error.response.status === 401) {
        window.location.href = '/';
      } else if (error.response.status === 500) {
        console.error('Server Error')
      }
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else {
      // Network error or CORS issue - no response from server
      console.error('Network Error:', error.message);
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;