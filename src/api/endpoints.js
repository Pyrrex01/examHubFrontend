import { api } from './client';

export const students = {
  list: (options) => api.get('/students', options),
  create: (data) => api.post('/students', data),
  update: (id, data) => api.put(`/students/${id}`, data),
  deactivate: (id) => api.delete(`/students/${id}`),
  reactivate: (id) => api.put(`/students/${id}`, { isActive: true }),
  resetPassword: (id, password) => api.put(`/students/${id}`, { password }),
};

export const courses = {
  list: (options) => api.get('/courses', options),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  remove: (id) => api.delete(`/courses/${id}`),
};

export const exams = {
  list: (options) => api.get('/exams', options),
  get: (id, options) => api.get(`/exams/${id}`, options),
  create: (data) => api.post('/exams', data),
  update: (id, data) => api.put(`/exams/${id}`, data),
  remove: (id) => api.delete(`/exams/${id}`),
  results: (id, options) => api.get(`/exams/${id}/results`, options),
};

export const questions = {
  listForExam: (examId, options) => api.get(`/exams/${examId}/questions`, options),
  create: (examId, data) => api.post(`/exams/${examId}/questions`, data),
  replace: (questionId, data) => api.put(`/questions/${questionId}`, data),
  remove: (questionId) => api.delete(`/questions/${questionId}`),
};

export const myExams = {
  available: (options) => api.get('/my/exams', options),
  paper: (examId, options) => api.get(`/my/exams/${examId}`, options),
  submit: (examId, answers) => api.post(`/my/exams/${examId}/submit`, { answers }),
};

export const myResults = {
  list: (options) => api.get('/my/results', options),
  forExam: (examId, options) => api.get(`/my/results?examId=${examId}`, options),
};
