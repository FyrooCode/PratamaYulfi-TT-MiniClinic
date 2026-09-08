const db = require('../config/db');

/**
 * Generate sequential Medical Record Number (Nomor Rekam Medis)
 * Format: RM-YYYY-XXXX (e.g. RM-2026-0004)
 * 
 * @param {import('pg').PoolClient|null} [dbClient=null] Optional active pool client (e.g. within a transaction)
 * @returns {Promise<string>} Formatted Medical Record Number
 */
const generateMedicalRecordNumber = async (dbClient = null) => {
  const currentYear = new Date().getFullYear();
  const pattern = `RM-${currentYear}-%`;

  const queryRunner = dbClient || db;
  const sql = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(medical_record_number FROM 9 FOR 4) AS INTEGER)), 0) AS last_number
    FROM patients
    WHERE medical_record_number LIKE $1
  `;

  const result = await queryRunner.query(sql, [pattern]);
  const lastNumber = parseInt(result.rows[0].last_number, 10) || 0;
  const nextNumber = lastNumber + 1;
  const paddedSequence = String(nextNumber).padStart(4, '0');

  return `RM-${currentYear}-${paddedSequence}`;
};

/**
 * Generate sequential Registration Number (Nomor Registrasi)
 * Format: REG-YYYYMMDD-XXX (e.g. REG-20260908-001)
 * 
 * @param {import('pg').PoolClient|null} [dbClient=null] Optional active pool client
 * @returns {Promise<string>} Formatted Registration Number
 */
const generateRegistrationNumber = async (dbClient = null) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  const pattern = `REG-${dateStr}-%`;

  const queryRunner = dbClient || db;
  const sql = `
    SELECT COALESCE(MAX(CAST(SUBSTRING(registration_number FROM 14 FOR 3) AS INTEGER)), 0) AS last_number
    FROM registrations
    WHERE registration_number LIKE $1
  `;

  const result = await queryRunner.query(sql, [pattern]);
  const lastNumber = parseInt(result.rows[0].last_number, 10) || 0;
  const nextNumber = lastNumber + 1;
  const paddedSequence = String(nextNumber).padStart(3, '0');

  return `REG-${dateStr}-${paddedSequence}`;
};

module.exports = {
  generateMedicalRecordNumber,
  generateRegistrationNumber,
};
