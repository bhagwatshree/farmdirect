import api from './axios';

export const getTemplates = () => api.get('/notifications/templates');
export const updateTemplates = (data) => api.put('/notifications/templates', data);
export const resetTemplates = () => api.delete('/notifications/templates');
