import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/context/NotificationContext';
import { registrationsApi } from '@/api/registrations.api';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { createExaminationColumns, formatQueueNumber } from '@/features/examinations/examination-columns';
import { ExaminationDataTable } from '@/features/examinations/ExaminationDataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Stethoscope,
  Search,
  RefreshCw,
  Building2,
  Filter,
  FileText,
  Activity,
  HeartPulse,
  Thermometer,
  Scale,
  Ruler,
  Pill,
  Loader2,
  Calendar,
  User,
  Clock,
  AlertCircle,
} from 'lucide-react';

const CLINIC_DEPARTMENTS = [
  { value: 'ALL', label: 'Semua Poli' },
  { value: 'Poli Umum', label: 'Poli Umum' },
  { value: 'Poli Gigi', label: 'Poli Gigi' },
  { value: 'Poli Anak', label: 'Poli Anak' },
  { value: 'Poli Penyakit Dalam', label: 'Poli Penyakit Dalam' },
];

const STATUS_FILTERS = [
  { value: 'ALL', label: 'Semua Status' },
  { value: 'Check In', label: 'Siap Diperiksa (Check In)' },
  { value: 'Pemeriksaan', label: 'Sedang Diperiksa' },
  { value: 'Selesai', label: 'Selesai Hari Ini' },
  { value: 'Menunggu', label: 'Menunggu Antrean' },
];

export default function ExaminationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedPoli, setSelectedPoli] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Table Data & Pagination
  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLoading, setIsLoading] = useState(false);

  // Detail Modal State (Viewing completed SOAP & Prescriptions)
  const [selectedPatientForSoap, setSelectedPatientForSoap] = useState(null);
  const [medicalRecordDetail, setMedicalRecordDetail] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoadingSoap, setIsLoadingSoap] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch registrations for examination view
  const fetchExaminations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await registrationsApi.getAll({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        clinic_department: selectedPoli !== 'ALL' ? selectedPoli : undefined,
        status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
      });

      if (res.success && res.data) {
        setRegistrations(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Gagal Memuat Data Pemeriksaan',
        message: err.response?.data?.message || 'Tidak dapat terhubung ke server.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, selectedPoli, selectedStatus, showNotification]);

  useEffect(() => {
    fetchExaminations();
  }, [fetchExaminations]);

  // Handler 1: Start Examination (Navigate to Patient Examination Detail Page)
  const handleStartExamination = (item) => {
    navigate(`/examination/${item.id}`);
  };

  // Handler 2: View Medical Record (SOAP) for Finished Patient
  const handleViewMedicalRecord = async (item) => {
    const patientId = item.patient_id || item.patient?.id;
    if (!patientId) {
      showNotification({
        type: 'error',
        title: 'Data Pasien Tidak Ditemukan',
        message: 'Informasi pasien tidak valid untuk memuat rekam medis.',
      });
      return;
    }

    setSelectedPatientForSoap(item);
    setIsDetailModalOpen(true);
    setIsLoadingSoap(true);

    try {
      const res = await medicalRecordsApi.getByPatientId(patientId);

      if (res.success && res.data) {
        // Find medical record corresponding to this registration_id or take the latest
        const records = res.data.medical_records || [];
        const matchingRecord = records.find((mr) => mr.registration_id === item.id) || records[0];
        setMedicalRecordDetail(matchingRecord || null);
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Gagal Memuat Rekam Medis',
        message: err.response?.data?.message || 'Terjadi kesalahan saat memuat SOAP.',
      });
    } finally {
      setIsLoadingSoap(false);
    }
  };

  // Build table columns
  const columns = React.useMemo(() => {
    return createExaminationColumns({
      onStartExamination: handleStartExamination,
      onViewMedicalRecord: handleViewMedicalRecord,
    });
  }, [navigate]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 shadow-2xs">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Pemeriksaan Dokter (SOAP)
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Daftar kunjungan pasien untuk pemeriksaan fisik medis, diagnosis SOAP, dan resep obat.
            </p>
          </div>
        </div>

        {/* Global Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchExaminations}
          disabled={isLoading}
          className="gap-2 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none self-start sm:self-auto h-9"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Quick Filter Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            Status:
          </span>
          {STATUS_FILTERS.map((st) => {
            const isActive = selectedStatus === st.value;
            return (
              <button
                key={st.value}
                type="button"
                onClick={() => {
                  setSelectedStatus(st.value);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Search & Poli Dropdown Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama pasien, no. RM, no. registrasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm bg-white border-slate-200 shadow-none focus-visible:ring-teal-500"
            />
          </div>

          {/* Filter Poli Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto self-end sm:self-auto">
            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1 shrink-0">
              <Building2 className="h-3.5 w-3.5 text-slate-400" />
              Poli:
            </span>
            <Select
              value={selectedPoli}
              onValueChange={(val) => {
                setSelectedPoli(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-10 text-xs sm:text-sm bg-white border-slate-200 shadow-none">
                <SelectValue placeholder="Semua Poli" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectGroup>
                  {CLINIC_DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.value} value={dept.value} className="text-xs sm:text-sm">
                      {dept.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Reset Filter Button */}
            {(selectedPoli !== 'ALL' || selectedStatus !== 'ALL' || searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPoli('ALL');
                  setSelectedStatus('ALL');
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="h-10 px-2.5 text-xs text-slate-500 hover:text-slate-900"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Examination Data Table */}
      <ExaminationDataTable
        columns={columns}
        data={registrations}
        pagination={pagination}
        onPageChange={setCurrentPage}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => {
          setPageSize(newSize);
          setCurrentPage(1);
        }}
        isLoading={isLoading}
      />

      {/* Quick View Medical Record (SOAP) Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl bg-white max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2 text-teal-600">
              <FileText className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold text-slate-900">
                Hasil Pemeriksaan Medis (SOAP)
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Rincian anamnesis, pemeriksaan fisik tanda vital, diagnosis, dan resep obat pasien.
            </DialogDescription>
          </DialogHeader>

          {isLoadingSoap ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
              <p className="text-sm font-medium">Memuat data rekam medis...</p>
            </div>
          ) : !medicalRecordDetail ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
              <p className="font-semibold text-slate-800">
                Data Rekam Medis Belum Tersedia
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Pasien ini belum memiliki catatan pemeriksaan SOAP yang tersimpan di sistem.
              </p>
            </div>
          ) : (
            <div className="space-y-5 pt-2 text-slate-800">
              {/* Patient Banner */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="font-bold text-slate-900 text-sm">
                    {selectedPatientForSoap?.patient_name || selectedPatientForSoap?.patient?.name || '-'}
                  </span>
                  <Badge variant="outline" className="bg-white text-slate-700">
                    {selectedPatientForSoap?.medical_record_number || selectedPatientForSoap?.patient?.medical_record_number}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-slate-500">
                  <span>Poli: <strong>{selectedPatientForSoap?.clinic_department || '-'}</strong></span>
                  <span>Dokter: <strong>{medicalRecordDetail.doctor_name || 'dr. Budi Santoso, Sp.PD'}</strong></span>
                </div>
              </div>

              {/* S: Subjective */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-md bg-teal-100 text-teal-900 flex items-center justify-center text-xs font-bold">
                    S
                  </span>
                  <span>Subjective (Anamnesis & Keluhan)</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pl-6">
                  {medicalRecordDetail.subjective || '-'}
                </p>
              </div>

              {/* O: Objective (Vital Signs) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-md bg-blue-100 text-blue-900 flex items-center justify-center text-xs font-bold">
                    O
                  </span>
                  <span>Objective (Tanda-Tanda Vital)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pl-6">
                  {/* Blood Pressure */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                      Tekanan Darah
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {medicalRecordDetail.systolic_bp && medicalRecordDetail.diastolic_bp
                        ? `${medicalRecordDetail.systolic_bp}/${medicalRecordDetail.diastolic_bp} mmHg`
                        : '-'}
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                      Suhu Tubuh
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {medicalRecordDetail.temperature ? `${medicalRecordDetail.temperature} °C` : '-'}
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Scale className="h-3.5 w-3.5 text-indigo-500" />
                      Berat Badan
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {medicalRecordDetail.weight ? `${medicalRecordDetail.weight} kg` : '-'}
                    </div>
                  </div>

                  {/* Height */}
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                      <Ruler className="h-3.5 w-3.5 text-emerald-500" />
                      Tinggi Badan
                    </div>
                    <div className="text-sm font-bold text-slate-900 mt-1">
                      {medicalRecordDetail.height ? `${medicalRecordDetail.height} cm` : '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* A: Assessment */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-md bg-purple-100 text-purple-900 flex items-center justify-center text-xs font-bold">
                    A
                  </span>
                  <span>Assessment (Diagnosis)</span>
                </div>
                <div className="pl-6">
                  <span className="inline-block px-3 py-1 rounded-lg bg-purple-50 border border-purple-200 text-sm font-bold text-purple-900">
                    {medicalRecordDetail.assessment || '-'}
                  </span>
                </div>
              </div>

              {/* P: Plan & Medical Actions */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                  <span className="h-5 w-5 rounded-md bg-emerald-100 text-emerald-900 flex items-center justify-center text-xs font-bold">
                    P
                  </span>
                  <span>Plan (Rencana Terapi & Tindakan)</span>
                </div>
                <div className="pl-6 space-y-2">
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {medicalRecordDetail.plan || '-'}
                  </p>
                  {medicalRecordDetail.medical_actions && (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-700">
                      <strong>Tindakan Medis:</strong> {medicalRecordDetail.medical_actions}
                    </div>
                  )}
                </div>
              </div>

              {/* Prescriptions (Resep Obat Terstruktur) */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-teal-700 flex items-center gap-1.5">
                  <Pill className="h-4 w-4 text-teal-600" />
                  <span>Resep Obat Terstruktur</span>
                </div>
                <div className="pl-6">
                  {medicalRecordDetail.medicines && medicalRecordDetail.medicines.length > 0 ? (
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                          <tr>
                            <th className="py-2.5 px-3 text-center">Nama Obat</th>
                            <th className="py-2.5 px-3 text-center">Dosis</th>
                            <th className="py-2.5 px-3 text-center">Aturan Pakai</th>
                            <th className="py-2.5 px-3 text-center">Jumlah</th>
                            <th className="py-2.5 px-3 text-center">Instruksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {medicalRecordDetail.medicines.map((med, idx) => (
                            <tr key={med.id || idx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">{med.medicine_name}</td>
                              <td className="py-2.5 px-3">{med.dosage}</td>
                              <td className="py-2.5 px-3 font-medium text-teal-800">{med.frequency}</td>
                              <td className="py-2.5 px-3">{med.quantity}</td>
                              <td className="py-2.5 px-3 text-slate-500">{med.instructions || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Tidak ada resep obat terstruktur untuk kunjungan ini.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDetailModalOpen(false)}
              className="text-xs sm:text-sm font-medium border-slate-200"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
