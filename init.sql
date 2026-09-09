-- =============================================================================
-- PostgreSQL Database Initialization Script: Mini Clinic Information System
-- Memenuhi 100% Ruang Lingkup Pengerjaan (Bagian D) Technical Test
-- Di-mount otomatis ke /docker-entrypoint-initdb.d/init.sql
-- =============================================================================

-- Enable UUID extension jika diperlukan di masa mendatang
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Tabel: users (Manajemen User & Autentikasi)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- bcrypt hash
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
    refresh_token TEXT,
    token_invalidated_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 2. Tabel: patients (Data Induk Pasien)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS patients (
    id SERIAL PRIMARY KEY,
    medical_record_number VARCHAR(20) UNIQUE NOT NULL, -- No. Rekam Medis (RM)
    nik VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('L', 'P', 'Male', 'Female')),
    dob DATE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. Tabel: registrations (Modul Pendaftaran Pasien)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,
    registration_number VARCHAR(30) UNIQUE NOT NULL,
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INT REFERENCES users(id) ON DELETE SET NULL,
    clinic_department VARCHAR(50) NOT NULL, -- Poli Umum, Poli Gigi, Poli Anak, dll.
    visit_date DATE NOT NULL,
    payment_type VARCHAR(30) NOT NULL, -- BPJS / Umum / Asuransi
    initial_complaint TEXT,
    status VARCHAR(20) DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Check In', 'Pemeriksaan', 'Selesai', 'Batal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 4. Tabel: queues (Modul Antrean Pasien)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS queues (
    id SERIAL PRIMARY KEY,
    registration_id INT NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    queue_number VARCHAR(10) NOT NULL, -- Contoh format: A001, A002
    status VARCHAR(20) DEFAULT 'Menunggu' CHECK (status IN ('Menunggu', 'Check In', 'Pemeriksaan', 'Selesai', 'Batal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 5. Tabel: medical_records (Modul Pemeriksaan Dokter - Metode SOAP)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    registration_id INT UNIQUE NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
    patient_id INT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id INT REFERENCES users(id) ON DELETE SET NULL,
    subjective TEXT NOT NULL,         -- S: Anamnesis / Keluhan utama pasien
    systolic_bp INT,                  -- O: Tekanan darah sistolik (mmHg)
    diastolic_bp INT,                 -- O: Tekanan darah diastolik (mmHg)
    temperature DECIMAL(4,1),         -- O: Suhu tubuh (°C)
    weight DECIMAL(5,2),              -- O: Berat badan (kg)
    height DECIMAL(5,2),              -- O: Tinggi badan (cm)
    assessment TEXT NOT NULL,         -- A: Diagnosa dokter
    plan TEXT NOT NULL,               -- P: Rencana terapi & penanganan
    medical_actions TEXT,             -- Tindakan medis yang diberikan
    prescription TEXT,                -- Resep obat untuk pasien (catatan umum resep)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 6. Tabel: prescriptions (Modul Resep Obat Terstruktur)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    medical_record_id INT NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
    medicine_name VARCHAR(150) NOT NULL,
    dosage VARCHAR(50) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Indexes untuk Optimasi Performa Query
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(medical_record_number);
CREATE INDEX IF NOT EXISTS idx_patients_nik ON patients(nik);
CREATE INDEX IF NOT EXISTS idx_registrations_patient_id ON registrations(patient_id);
CREATE INDEX IF NOT EXISTS idx_registrations_doctor_id ON registrations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_registrations_visit_date ON registrations(visit_date);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
CREATE INDEX IF NOT EXISTS idx_queues_registration_id ON queues(registration_id);
CREATE INDEX IF NOT EXISTS idx_queues_status ON queues(status);
CREATE INDEX IF NOT EXISTS idx_queues_updated_at ON queues(updated_at);
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_registration_id ON medical_records(registration_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_medical_record_id ON prescriptions(medical_record_id);

-- -----------------------------------------------------------------------------
-- Function & Trigger untuk Otomatisasi Kolom updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_registrations_updated_at ON registrations;
CREATE TRIGGER update_registrations_updated_at BEFORE UPDATE ON registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_queues_updated_at ON queues;
CREATE TRIGGER update_queues_updated_at BEFORE UPDATE ON queues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medical_records_updated_at ON medical_records;
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prescriptions_updated_at ON prescriptions;
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON prescriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DATA DUMMY (SEED DATA)
-- =============================================================================

-- 1. Default Users (Password semua akun: 'password123')
-- Hash bcrypt 10 rounds: $2b$10$bsR6OKBXJdeiMISUGdO2mufdKfRELk3Ibvl1p6J9JbDh8hDqZPkEe
INSERT INTO users (name, email, password, role) VALUES
('Administrator Klinik', 'admin@clinic.com', '$2b$10$bsR6OKBXJdeiMISUGdO2mufdKfRELk3Ibvl1p6J9JbDh8hDqZPkEe', 'admin'),
('dr. Budi Santoso, Sp.PD', 'dr.budi@clinic.com', '$2b$10$bsR6OKBXJdeiMISUGdO2mufdKfRELk3Ibvl1p6J9JbDh8hDqZPkEe', 'doctor'),
('Siti Rahmawati (Resepsionis)', 'resepsionis@clinic.com', '$2b$10$bsR6OKBXJdeiMISUGdO2mufdKfRELk3Ibvl1p6J9JbDh8hDqZPkEe', 'receptionist')
ON CONFLICT (email) DO NOTHING;

-- 2. Dummy Pasien Lengkap dengan No. Rekam Medis (RM) & NIK
INSERT INTO patients (medical_record_number, nik, name, gender, dob, phone, address) VALUES
('RM-2026-0001', '3201012345670001', 'Ahmad Fauzi', 'L', '1990-05-14', '081234567890', 'Jl. Sudirman No. 45, Jakarta Pusat'),
('RM-2026-0002', '3201012345670002', 'Dewi Anggraini', 'P', '1995-11-20', '081298765432', 'Jl. Thamrin No. 12, Jakarta Pusat'),
('RM-2026-0003', '3201012345670003', 'Rian Pratama', 'L', '2001-02-08', '085712345678', 'Jl. Merdeka Barat No. 8, Jakarta Pusat')
ON CONFLICT (medical_record_number) DO NOTHING;

-- 3. Registrasi & Antrean Awal Hari Ini (CURRENT_DATE)
-- Pasien 1 (Ahmad Fauzi) - Poli Umum - Selesai Diperiksa
INSERT INTO registrations (id, registration_number, patient_id, doctor_id, clinic_department, visit_date, payment_type, initial_complaint, status) VALUES
(1, 'REG-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-001', 1, 2, 'Poli Umum', CURRENT_DATE, 'BPJS', 'Demam tinggi dan sakit kepala sejak 2 hari yang lalu', 'Selesai')
ON CONFLICT (registration_number) DO NOTHING;

INSERT INTO queues (registration_id, queue_number, status) VALUES
(1, 'A001', 'Selesai')
ON CONFLICT DO NOTHING;

-- Pasien 2 (Dewi Anggraini) - Poli Gigi - Menunggu Antrean
INSERT INTO registrations (id, registration_number, patient_id, doctor_id, clinic_department, visit_date, payment_type, initial_complaint, status) VALUES
(2, 'REG-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-002', 2, 2, 'Poli Gigi', CURRENT_DATE, 'Umum', 'Sakit gigi geraham belakang kiri terasa ngilu saat minum dingin', 'Menunggu')
ON CONFLICT (registration_number) DO NOTHING;

INSERT INTO queues (registration_id, queue_number, status) VALUES
(2, 'A002', 'Menunggu')
ON CONFLICT DO NOTHING;

-- Menyesuaikan sequence ID registrations agar auto-increment berjalan normal setelah seed
SELECT setval(pg_get_serial_sequence('registrations', 'id'), (SELECT COALESCE(MAX(id), 1) FROM registrations));

-- 4. Riwayat Rekam Medis (SOAP) Contoh untuk Pasien 1 (History Selesai)
INSERT INTO medical_records (
    id,
    registration_id,
    patient_id,
    doctor_id,
    subjective,
    systolic_bp,
    diastolic_bp,
    temperature,
    weight,
    height,
    assessment,
    plan,
    medical_actions,
    prescription
) VALUES (
    1,
    1,
    1,
    2,
    'Pasien mengeluhkan demam tinggi sejak 2 hari yang lalu disertai sakit kepala berdenyut, nyeri otot/sendi, badan lemas, dan nafsu makan berkurang.',
    120,
    80,
    38.5,
    65.50,
    170.00,
    'Febris Akut susp. Viral Infection ec Observasi Febris Hari ke-2',
    'Tirah baring (bed rest), edukasi hidrasi oral 2-3 liter per hari, kompres hangat bila demam > 38°C, kontrol kembali bila demam menetap > 3 hari.',
    'Pemeriksaan fisik tanda vital lengkap, palpasi abdomen (tidak ada hepatosplenomegali), uji torniquet negatif.',
    '1. Paracetamol 500 mg tab No. X - S 3 dd tab 1 (prn demam)\n2. Multivitamin B Complex & Vit C tab No. X - S 1 dd tab 1 (pc)\n3. Antasida Doen tab No. X - S 3 dd tab 1 (ac)'
) ON CONFLICT (id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('medical_records', 'id'), (SELECT COALESCE(MAX(id), 1) FROM medical_records));

-- 5. Resep Obat Terstruktur untuk Rekam Medis Pasien 1 (medical_record_id: 1)
INSERT INTO prescriptions (medical_record_id, medicine_name, dosage, frequency, quantity, instructions) VALUES
(1, 'Paracetamol', '500 mg', '3x1 tablet', 10, 'Diminum sesudah makan bila demam atau nyeri'),
(1, 'Multivitamin B-Complex & Vit C', '1 tablet', '1x1 tablet', 10, 'Diminum di pagi hari sesudah makan'),
(1, 'Antasida Doen', '1 tablet kunyah', '3x1 tablet', 10, 'Dikunyah 30 menit sebelum makan')
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('prescriptions', 'id'), (SELECT COALESCE(MAX(id), 1) FROM prescriptions));
