import api from './axios';

export const patientsApi = {
  getAll: async ({ page = 1, limit = 10, search = '' } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);

    const res = await api.get(`/patients?${params.toString()}`);
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/patients/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/patients', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/patients/${id}`, data);
    return res.data;
  },

  delete: async (id) => {
    const res = await api.delete(`/patients/${id}`);
    return res.data;
  },
};
