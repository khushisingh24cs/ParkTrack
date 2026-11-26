import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 6000,
});

export const fetchHealth = () => api.get('/health').then((r) => r.data);
export const fetchOverview = () => api.get('/overview').then((r) => r.data);
export const fetchReports = (params) => api.get('/reports', { params }).then((r) => r.data);
export const fetchRejected = () => api.get('/reports/rejected').then((r) => r.data);
export const submitReport = (payload) => api.post('/reports', payload).then((r) => r.data);
export const updateReportStatus = (id, payload) =>
  api.patch(`/reports/${id}/status`, payload).then((r) => r.data);
export const reviewUnmappedReport = (id, category) =>
  api.post(`/reports/${id}/review`, { category }).then((r) => r.data);
export const dispatchPendingReports = () =>
  api.post('/reports/dispatch-pending').then((r) => r.data);

export const fetchHandlers = () => api.get('/handlers').then((r) => r.data);
export const createHandler = (payload) => api.post('/handlers', payload).then((r) => r.data);
export const updateHandler = (id, payload) =>
  api.patch(`/handlers/${id}`, payload).then((r) => r.data);

export const fetchAnalytics = () => api.get('/analytics').then((r) => r.data);

export const validateAutomata = (vehicleNumber, violationCode) =>
  api.post('/automata/validate', { vehicleNumber, violationCode }).then((r) => r.data);
export const classifyAutomata = (violationCode, description = '') =>
  api.post('/automata/classify', { violationCode, description }).then((r) => r.data);
export const compareAutomata = (strings) =>
  api.post('/automata/compare', strings ? { strings } : {}).then((r) => r.data);

