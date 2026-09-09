import api from './axios';

export const medicalRecordsApi = {
  /**
   * Create new medical record (SOAP) + optional batch prescriptions
   * @param {Object} payload - { registration_id, subjective, systolic_bp, diastolic_bp, temperature, weight, height, assessment, plan, medical_actions, prescription, medicines: [...] }
   */
  create: async (payload) => {
    const res = await api.post('/medical-records', payload);
    return res.data;
  },

  /**
   * Get single medical record detail by record ID
   * @param {number|string} id
   */
  getDetail: async (id) => {
    const res = await api.get(`/medical-records/detail/${id}`);
    return res.data;
  },

  /**
   * Get all medical records history for a specific patient
   * @param {number|string} patientId
   */
  getByPatientId: async (patientId) => {
    const res = await api.get(`/medical-records/${patientId}`);
    return res.data;
  },
};
