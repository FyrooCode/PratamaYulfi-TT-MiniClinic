/**
 * Clinic Department Master Constants & Queue Prefix Mapping
 */
const CLINIC_DEPARTMENTS = [
  { code: 'UMUM', name: 'Poli Umum', prefix: 'A' },
  { code: 'GIGI', name: 'Poli Gigi', prefix: 'B' },
  { code: 'ANAK', name: 'Poli Anak', prefix: 'C' },
  { code: 'DALAM', name: 'Poli Penyakit Dalam', prefix: 'D' },
];

/**
 * Get queue letter prefix based on clinic department name or code
 * @param {string} department 
 * @returns {string} Single uppercase letter prefix (A, B, C, D)
 */
const getDepartmentPrefix = (department) => {
  const clean = (department || '').toLowerCase().trim();
  const dept = CLINIC_DEPARTMENTS.find(
    (d) => d.name.toLowerCase() === clean || d.code.toLowerCase() === clean
  );
  return dept ? dept.prefix : 'A';
};

module.exports = {
  CLINIC_DEPARTMENTS,
  getDepartmentPrefix,
};
