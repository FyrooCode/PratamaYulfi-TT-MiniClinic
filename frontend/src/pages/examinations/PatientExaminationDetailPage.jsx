import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/context/NotificationContext';
import { registrationsApi } from '@/api/registrations.api';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { formatQueueNumber } from '@/features/examinations/examination-columns';
import SoapExaminationForm from '@/features/examinations/SoapExaminationForm';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Stethoscope,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  User,
  Phone,
  MapPin,
  Clock,
  HeartPulse,
  Thermometer,
  Scale,
  Ruler,
  Pill,
  Loader2,
  AlertCircle,
  CheckCircle2,
  History,
  Activity,
  FileQuestion,
  Printer,
  ClipboardList,
} from 'lucide-react';

export default function PatientExaminationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [registration, setRegistration] = useState(null);
  const [historicalRecords, setHistoricalRecords] = useState([]);
  const [currentMedicalRecord, setCurrentMedicalRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingExam, setIsStartingExam] = useState(false);

  // Fetch registration visit & historical medical records
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch current registration visit
      const regRes = await registrationsApi.getById(id);

      if (!regRes.success || !regRes.data) {
        showNotification({
          type: 'error',
          title: 'Kunjungan Tidak Ditemukan',
          message: 'Data registrasi kunjungan tidak ditemukan di sistem.',
        });
        navigate('/examination');
        return;
      }

      const regData = regRes.data;
      setRegistration(regData);

      // 2. Fetch patient's past medical records if patient ID exists
      const patientId = regData.patient_id || regData.patient?.id;
      if (patientId) {
        try {
          const soapRes = await medicalRecordsApi.getByPatientId(patientId);
          if (soapRes.success && soapRes.data) {
            const allRecords = soapRes.data.medical_records || [];
            
            // Check if this visit already has a completed medical record
            const currentRec = allRecords.find((r) => r.registration_id === regData.id);
            setCurrentMedicalRecord(currentRec || null);

            // Filter out current visit's record from historical list for clarity
            const pastRecords = allRecords.filter((r) => r.registration_id !== regData.id);
            setHistoricalRecords(pastRecords);
          }
        } catch (soapErr) {
          // If 404 or no prior records, set empty
          setHistoricalRecords([]);
          setCurrentMedicalRecord(null);
        }
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: err.response?.data?.message || 'Terjadi kesalahan saat memuat data kunjungan.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [id, navigate, showNotification]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handler: Mulai Periksa (Update status to 'Pemeriksaan' in backend)
  const handleStartExamination = async () => {
    if (!registration) return;
    setIsStartingExam(true);

    try {
      const res = await registrationsApi.updateStatus(id, 'Pemeriksaan');

      if (res.success) {
        setRegistration((prev) => ({
          ...prev,
          status: 'Pemeriksaan',
        }));

        showNotification({
          type: 'success',
          title: 'Pemeriksaan Dimulai',
          message: `Status pasien diubah menjadi "Sedang Diperiksa". Silakan isi formulir SOAP.`,
        });
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Gagal Memulai Pemeriksaan',
        message: err.response?.data?.message || 'Terjadi kesalahan saat memperbarui status pemeriksaan.',
      });
    } finally {
      setIsStartingExam(false);
    }
  };

  // Handler: After SOAP successfully submitted
  const handleSoapSuccess = (savedRecord) => {
    setRegistration((prev) => ({
      ...prev,
      status: 'Selesai',
    }));
    setCurrentMedicalRecord(savedRecord);
    fetchData();
  };

  const calculateAge = (dobString) => {
    if (!dobString) return '-';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} tahun` : '-';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-500 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <p className="text-sm font-medium">Memuat detail kunjungan & rekam medis...</p>
      </div>
    );
  }

  if (!registration) return null;

  const patient = registration.patient || {};
  const queueNumber = registration.queue?.queue_number || registration.queue_number;
  const isFinished = registration.status === 'Selesai';
  const isExamining = registration.status === 'Pemeriksaan';
  const isCheckIn = registration.status === 'Check In';
  const canStartExam = isCheckIn || registration.status === 'Menunggu';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Navigation & Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/examination')}
          className="gap-2 text-slate-600 hover:text-slate-900 -ml-2 mb-3 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Pemeriksaan</span>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                  Detail Kunjungan & Riwayat Pasien
                </h1>
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold px-2.5 py-0.5 ${
                    registration.status === 'Check In'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : registration.status === 'Pemeriksaan'
                      ? 'bg-purple-50 text-purple-800 border-purple-300'
                      : registration.status === 'Selesai'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  {registration.status}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 mt-1 max-w-[65ch]">
                Pratinjau informasi pendaftaran dan riwayat medis pasien sebelum memulai tindakan SOAP.
              </p>
            </div>
          </div>

          {/* Quick Action Button at Top Right */}
          <div className="flex items-center gap-2 shrink-0">
            {canStartExam && (
              <Button
                onClick={handleStartExamination}
                disabled={isStartingExam}
                className="h-12 px-6 text-base font-bold gap-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
              >
                {isStartingExam ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Stethoscope className="h-5 w-5 text-teal-100" />
                )}
                <span>Mulai Periksa</span>
              </Button>
            )}

            {isExamining && (
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-800 border-purple-300 px-3.5 py-2 text-xs font-bold gap-2 shadow-2xs"
              >
                <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
                Sedang Dalam Ruang Pemeriksaan
              </Badge>
            )}

            {isFinished && (
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-800 border-emerald-300 px-3.5 py-2 text-xs font-bold gap-1.5 shadow-2xs"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Pemeriksaan Selesai
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Kunjungan Hari Ini & Profil Induk Pasien */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Informasi Kunjungan Hari Ini (7 Cols) */}
        <div className="lg:col-span-7">
          <Card className="border-slate-200 shadow-sm bg-white h-full">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-teal-600" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Informasi Kunjungan Hari Ini
                </CardTitle>
              </div>

              {queueNumber && (
                <Badge
                  variant="outline"
                  className="bg-teal-50 text-teal-800 border-teal-300 font-bold text-sm px-2.5 py-0.5"
                >
                  Antrean: {formatQueueNumber(queueNumber)}
                </Badge>
              )}
            </CardHeader>

            <CardContent className="p-5 space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    No. Registrasi
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {registration.registration_number || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Poli Tujuan
                  </span>
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Building2 className="h-3.5 w-3.5 text-teal-600" />
                    {registration.clinic_department || '-'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Tanggal Kunjungan
                  </span>
                  <span className="font-medium text-slate-800">
                    {formatDate(registration.visit_date)}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Metode Pembayaran
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-xs font-semibold text-slate-800 mt-0.5">
                    <CreditCard className="h-3 w-3 text-slate-500" />
                    {registration.payment_type || 'Umum'}
                  </span>
                </div>
              </div>

              {/* Keluhan Awal Box */}
              <div className="pt-3 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Keluhan Awal Pasien (Pendaftaran)
                </span>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs sm:text-sm leading-relaxed">
                  {registration.initial_complaint || (
                    <span className="italic text-slate-400">
                      Tidak ada keluhan awal yang dicatat saat pendaftaran.
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card 2: Profil Induk Pasien (5 Cols) */}
        <div className="lg:col-span-5">
          <Card className="border-slate-200 shadow-sm bg-white h-full">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Profil Induk Pasien
                </CardTitle>
              </div>

              <Badge
                variant="outline"
                className="bg-slate-50 border-slate-200 text-slate-700 text-xs"
              >
                {patient.medical_record_number || '-'}
              </Badge>
            </CardHeader>

            <CardContent className="p-5 space-y-3.5 text-sm">
              <div>
                <span className="text-xs text-slate-500 font-medium block">
                  Nama Lengkap Pasien
                </span>
                <span className="font-bold text-slate-900 text-base">
                  {patient.name || '-'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Jenis Kelamin
                  </span>
                  <span className="font-medium text-slate-800">
                    {patient.gender === 'L' || patient.gender === 'Male'
                      ? 'Laki-laki'
                      : 'Perempuan'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 font-medium block">
                    Usia / Tgl Lahir
                  </span>
                  <span className="font-medium text-slate-800">
                    {calculateAge(patient.dob)} ({formatDate(patient.dob)})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CONDITIONAL SECTION A: FORMULIR PEMERIKSAAN DOKTER (JIKA STATUS PEMERIKSAAN) */}
      {isExamining && (
        <div id="soap-form-section" className="scroll-mt-6">
          <SoapExaminationForm
            registration={registration}
            onSuccess={handleSoapSuccess}
          />
        </div>
      )}

      {/* CONDITIONAL SECTION B: HASIL PEMERIKSAAN KUNJUNGAN HARI INI (JIKA STATUS SELESAI) */}
      {isFinished && currentMedicalRecord && (
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Hasil Rekam Medis Kunjungan Hari Ini (Selesai)
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Catatan SOAP dan resep yang telah dicatat oleh dokter pemeriksa.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="h-8 text-xs font-semibold gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              <Printer className="h-3.5 w-3.5 text-slate-500" />
              Cetak Resume Medis
            </Button>
          </CardHeader>

          <CardContent className="p-5 space-y-4">
            {/* Grid S & A */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <span className="font-bold text-teal-800 uppercase tracking-wider text-xs block">
                  [S] Anamnesis / Subjektif
                </span>
                <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
                  {currentMedicalRecord.subjective || '-'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-1">
                <span className="font-bold text-purple-900 uppercase tracking-wider text-xs block">
                  [A] Diagnosis / Asesmen
                </span>
                <p className="text-purple-950 font-semibold leading-relaxed text-xs sm:text-sm">
                  {currentMedicalRecord.assessment || '-'}
                </p>
              </div>
            </div>

            {/* Objective Bar */}
            {(currentMedicalRecord.systolic_bp ||
              currentMedicalRecord.temperature ||
              currentMedicalRecord.weight ||
              currentMedicalRecord.height) && (
              <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-blue-50/50 border border-blue-200/80 text-xs text-slate-700">
                <span className="font-bold text-blue-800 uppercase tracking-wider text-[11px]">
                  [O] Tanda Vital:
                </span>
                {currentMedicalRecord.systolic_bp && currentMedicalRecord.diastolic_bp && (
                  <span>
                    TD:{' '}
                    <strong>
                      {currentMedicalRecord.systolic_bp}/{currentMedicalRecord.diastolic_bp} mmHg
                    </strong>
                  </span>
                )}
                {currentMedicalRecord.temperature && (
                  <span>
                    Suhu: <strong>{currentMedicalRecord.temperature} °C</strong>
                  </span>
                )}
                {currentMedicalRecord.weight && (
                  <span>
                    BB: <strong>{currentMedicalRecord.weight} kg</strong>
                  </span>
                )}
                {currentMedicalRecord.height && (
                  <span>
                    TB: <strong>{currentMedicalRecord.height} cm</strong>
                  </span>
                )}
              </div>
            )}

            {/* Plan & Procedures */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs sm:text-sm">
              <div>
                <strong className="text-slate-900 uppercase tracking-wider text-xs block mb-1">
                  [P] Terapi & Rencana Medis:
                </strong>
                <p className="text-slate-700 leading-relaxed">
                  {currentMedicalRecord.plan || '-'}
                </p>
              </div>

              {currentMedicalRecord.medical_actions && (
                <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                  <strong className="text-slate-800">Tindakan Tambahan:</strong>{' '}
                  {currentMedicalRecord.medical_actions}
                </div>
              )}
            </div>

            {/* Resep Obat Pasien */}
            {currentMedicalRecord.medicines && currentMedicalRecord.medicines.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-2 flex items-center gap-1.5">
                  <Pill className="h-3.5 w-3.5 text-teal-600" />
                  Daftar Resep Obat Diberikan
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {currentMedicalRecord.medicines.map((med, mIdx) => (
                    <div
                      key={med.id || mIdx}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-900">
                        {med.medicine_name} ({med.dosage})
                      </div>
                      <div className="text-slate-600">
                        Aturan: <strong>{med.frequency}</strong>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Jumlah: {med.quantity} {med.instructions ? `• ${med.instructions}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card 3: Riwayat Rekam Medis Pasien (Historical SOAP) */}
      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-teal-600" />
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Riwayat Rekam Medis Terdahulu (Historical SOAP)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar pemeriksaan medis dan resep obat yang pernah dicatat untuk pasien ini.
              </p>
            </div>
          </div>

          <Badge
            variant="secondary"
            className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5"
          >
            {historicalRecords.length} Riwayat Kunjungan
          </Badge>
        </CardHeader>

        <CardContent className="p-5">
          {historicalRecords.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
              <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
                <FileQuestion className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">
                Belum Ada Riwayat Rekam Medis
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Pasien ini belum memiliki riwayat pemeriksaan SOAP terdahulu. Ini merupakan catatan medis pertamanya.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historicalRecords.map((record, index) => (
                <div
                  key={record.id || index}
                  className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all space-y-3.5"
                >
                  {/* Header: Tanggal Kunjungan & Dokter */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-teal-50 text-teal-800 border-teal-200 font-semibold shadow-none">
                        Kunjungan #{historicalRecords.length - index}
                      </Badge>
                      <span className="font-semibold text-slate-800">
                        {formatDate(record.visit_date || record.created_at)}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">
                        Poli: <strong>{record.clinic_department || 'Poli Umum'}</strong>
                      </span>
                    </div>

                    <div className="text-slate-500">
                      Dokter: <strong>{record.doctor_name || 'dr. Budi Santoso, Sp.PD'}</strong>
                    </div>
                  </div>

                  {/* S & A Summary Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Subjective */}
                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-1">
                      <span className="font-bold text-teal-800 uppercase tracking-wider text-[11px] block">
                        [S] Anamnesis / Keluhan
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {record.subjective || '-'}
                      </p>
                    </div>

                    {/* Assessment */}
                    <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-200/80 space-y-1">
                      <span className="font-bold text-purple-900 uppercase tracking-wider text-[11px] block">
                        [A] Diagnosis Dokter
                      </span>
                      <p className="text-purple-950 font-semibold leading-relaxed">
                        {record.assessment || '-'}
                      </p>
                    </div>
                  </div>

                  {/* Objective (Vital Signs Mini Bar) */}
                  {(record.systolic_bp || record.temperature || record.weight || record.height) && (
                    <div className="flex flex-wrap items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                      <span className="font-bold text-blue-800 uppercase tracking-wider text-[10px]">
                        [O] Tanda Vital:
                      </span>
                      {record.systolic_bp && record.diastolic_bp && (
                        <span>TD: <strong>{record.systolic_bp}/{record.diastolic_bp} mmHg</strong></span>
                      )}
                      {record.temperature && (
                        <span>Suhu: <strong>{record.temperature} °C</strong></span>
                      )}
                      {record.weight && (
                        <span>BB: <strong>{record.weight} kg</strong></span>
                      )}
                      {record.height && (
                        <span>TB: <strong>{record.height} cm</strong></span>
                      )}
                    </div>
                  )}

                  {/* Plan & Prescriptions */}
                  <div className="text-xs space-y-2">
                    <div className="text-slate-700">
                      <strong className="text-emerald-800 uppercase tracking-wider text-[11px] mr-1">
                        [P] Terapi & Rencana:
                      </strong>
                      <span>{record.plan || '-'}</span>
                    </div>

                    {/* Structured Medicines Tags */}
                    {record.medicines && record.medicines.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-slate-500 font-semibold text-[11px] mr-1 flex items-center gap-1">
                          <Pill className="h-3 w-3 text-teal-600" />
                          Resep Obat:
                        </span>
                        {record.medicines.map((med, mIdx) => (
                          <span
                            key={med.id || mIdx}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-teal-50 border border-teal-200 text-teal-900 text-[11px] font-medium"
                          >
                            {med.medicine_name} ({med.dosage}) - {med.frequency}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
