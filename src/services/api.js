import axios from 'axios';

// Development - local backend
const API_BASE_URL = 'https://cipherbackend-8fej.onrender.com';

// Production - deployed backend (uncomment when deploying)
// const API_BASE_URL = 'https://cipherbackend-8fej.onrender.com';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cipherstudio_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('cipherstudio_token');
      localStorage.removeItem('cipherstudio_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  verify: () => api.get('/api/auth/verify'),
};

// Projects API
export const projectsAPI = {
  getAll: () => api.get('/api/projects'),
  getById: (id) => api.get(`/api/projects/${id}`),
  create: (projectData) => api.post('/api/projects', projectData),
  update: (id, projectData) => api.put(`/api/projects/${id}`, projectData),
  delete: (id) => api.delete(`/api/projects/${id}`),
  getStats: () => api.get('/api/projects/user/stats'),
};

// Files API
export const filesAPI = {
  create: (fileData) => api.post('/api/files', fileData),
  update: (id, fileData) => api.put(`/api/files/${id}`, fileData),
  delete: (id) => api.delete(`/api/files/${id}`),
  getByProject: (projectId) => api.get(`/api/files/project/${projectId}`),
  getById: (id) => api.get(`/api/files/${id}`),
};

// Health check
export const healthAPI = {
  check: () => api.get('/api/health'),
};

export default api;
