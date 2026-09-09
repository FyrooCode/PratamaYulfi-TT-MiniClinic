import api from './axios';

export const queuesApi = {
  getAll: async ({
    page = 1,
    limit = 10,
    status = '',
    clinic_department = '',
    date = '',
  } = {}) => {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    if (status && status !== 'ALL') params.append('status', status);
    if (clinic_department && clinic_department !== 'ALL') {
      params.append('clinic_department', clinic_department);
    }
    if (date) params.append('date', date);

    const res = await api.get(`/queues?${params.toString()}`);
    return res.data;
  },

  callNext: async () => {
    const res = await api.post('/queues/next');
    return res.data;
  },

  callById: async (id) => {
    const res = await api.put(`/queues/${id}/call`);
    return res.data;
  },

  updateStatus: async (id, status) => {
    const res = await api.patch(`/queues/${id}/status`, { status });
    return res.data;
  },

  getDisplay: async (param = '') => {
    let dept = '';
    if (typeof param === 'string') {
      dept = param;
    } else if (param && typeof param === 'object') {
      dept = param.clinic_department || '';
    }

    const params = new URLSearchParams();
    if (dept && dept !== 'ALL') {
      params.append('clinic_department', dept);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await api.get(`/queues/display${query}`);
    return res.data;
  },
};
