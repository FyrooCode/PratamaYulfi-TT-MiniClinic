import api from './axios';

export const registrationsApi = {
  getAll: async ({
    page = 1,
    limit = 10,
    search = '',
    status = '',
    visit_date = '',
    clinic_department = '',
    doctor_id = '',
  } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    if (visit_date) params.append('visit_date', visit_date);
    if (clinic_department) params.append('clinic_department', clinic_department);
    if (doctor_id) params.append('doctor_id', doctor_id);

    const res = await api.get(`/registrations?${params.toString()}`);
    return res.data;
  },

  getById: async (id) => {
    const res = await api.get(`/registrations/${id}`);
    return res.data;
  },

  create: async (data) => {
    const res = await api.post('/registrations', data);
    return res.data;
  },

  update: async (id, data) => {
    const res = await api.put(`/registrations/${id}`, data);
    return res.data;
  },

  cancel: async (id) => {
    const res = await api.patch(`/registrations/${id}/cancel`);
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await api.patch(`/registrations/${id}/status`, { status });
    return res.data;
  },

  getDoctors: async () => {
    const res = await api.get('/registrations/doctors');
    return res.data;
  },

  getDepartments: async () => {
    const res = await api.get('/registrations/departments');
    return res.data;
  },
};
