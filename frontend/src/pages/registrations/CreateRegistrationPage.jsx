import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/context/NotificationContext';
import { patientsApi } from '@/api/patients.api';
import { registrationsApi } from '@/api/registrations.api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@/components/ui/combobox';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  ClipboardList,
  Info,
  User,
  Stethoscope,
  Building2,
  Calendar as CalendarIcon,
  CreditCard,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
} from 'lucide-react';

// Const master data departemen/poli klinik sesuai backend (backend/src/constants/clinic.js)
const CLINIC_DEPARTMENTS = [
  { code: 'UMUM', name: 'Poli Umum', prefix: 'A' },
  { code: 'GIGI', name: 'Poli Gigi', prefix: 'B' },
  { code: 'ANAK', name: 'Poli Anak', prefix: 'C' },
  { code: 'DALAM', name: 'Poli Penyakit Dalam', prefix: 'D' },
];

export default function CreateRegistrationPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const todayStr = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    clinic_department: '',
    payment_type: 'Umum',
    visit_date: todayStr,
    initial_complaint: '',
  });

  // Data sources
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RBAC Guard: Doctor cannot register patient visits
  const canCreate = user?.role === 'admin' || user?.role === 'receptionist';

  // Fetch initial data for dropdowns (Patients & Doctors)
  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoadingPatients(true);
      setIsLoadingDoctors(true);

      try {
        const [patientsRes, doctorsRes] = await Promise.all([
          patientsApi.getAll({ page: 1, limit: 100 }),
          registrationsApi.getDoctors(),
        ]);

        if (patientsRes.success && patientsRes.data) {
          setPatients(patientsRes.data);
        }
        if (doctorsRes.success && doctorsRes.data) {
          setDoctors(doctorsRes.data);
        }
      } catch (err) {
        showNotification({
          type: 'error',
          title: 'Gagal Memuat Data Master',
          message: err.response?.data?.message || 'Tidak dapat memuat daftar pasien atau dokter.',
        });
      } finally {
        setIsLoadingPatients(false);
        setIsLoadingDoctors(false);
      }
    };

    fetchDropdownData();
  }, [showNotification]);

  if (!canCreate) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-lg">Akses Ditolak</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Hanya staf Resepsionis dan Admin yang memiliki izin untuk mendaftarkan kunjungan berobat pasien.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate('/registrations')}
              className="gap-2 border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Pendaftaran
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // 1. Patient ID
    if (!formData.patient_id) {
      newErrors.patient_id = 'Pilih pasien yang akan berobat';
    }

    // 2. Doctor ID
    if (!formData.doctor_id) {
      newErrors.doctor_id = 'Pilih dokter pemeriksa tujuan';
    }

    // 3. Clinic Department
    if (!formData.clinic_department) {
      newErrors.clinic_department = 'Pilih poli/departemen tujuan';
    }

    // 4. Payment Type
    if (!formData.payment_type) {
      newErrors.payment_type = 'Pilih jenis pembayaran';
    }

    // 5. Visit Date
    if (!formData.visit_date) {
      newErrors.visit_date = 'Tanggal kunjungan wajib diisi';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenConfirmation = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Mohon periksa kembali kolom isian yang bertanda merah.',
      });
      return;
    }

    setIsConfirmDialogOpen(true);
  };

  const executeCreateRegistration = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        patient_id: parseInt(formData.patient_id, 10),
        doctor_id: parseInt(formData.doctor_id, 10),
        clinic_department: formData.clinic_department,
        payment_type: formData.payment_type,
        visit_date: formData.visit_date,
        initial_complaint: formData.initial_complaint?.trim() || null,
      };

      const res = await registrationsApi.create(payload);

      if (res.success && res.data) {
        setIsConfirmDialogOpen(false);
        const queueNum = res.data.queue?.queue_number || res.data.queue_number || '-';
        showNotification({
          type: 'success',
          title: 'Pendaftaran Kunjungan Berhasil',
          message: `Pasien "${res.data.patient?.name || 'Pasien'}" berhasil didaftarkan ke ${res.data.clinic_department}. No. Registrasi: ${res.data.registration_number} • No. Antrean: ${queueNum}`,
        });
        navigate('/registrations');
      }
    } catch (err) {
      setIsConfirmDialogOpen(false);
      const responseData = err.response?.data;
      if (responseData?.errors) {
        setErrors(responseData.errors);
        showNotification({
          type: 'error',
          title: 'Gagal Menyimpan Pendaftaran',
          message: responseData.message || 'Terdapat kesalahan pada isian form.',
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Terjadi Kesalahan',
          message: responseData?.message || 'Tidak dapat terhubung ke server.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPatient = patients.find((p) => String(p.id) === String(formData.patient_id));
  const selectedDoctor = doctors.find((d) => String(d.id) === String(formData.doctor_id));

  // Filter patients by search term if typed
  const filteredPatients = patients.filter((p) => {
    if (!patientSearch.trim()) return true;
    const term = patientSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      p.medical_record_number.toLowerCase().includes(term) ||
      p.nik.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Navigation & Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/registrations')}
          className="gap-2 text-slate-600 hover:text-slate-900 -ml-2 mb-3 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Pendaftaran</span>
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <ClipboardList className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Pendaftaran Kunjungan Pasien
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-[65ch]">
              Lengkapi formulir di bawah ini untuk mendaftarkan pasien berobat ke poli dan dokter tujuan.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-generated Registration Info Banner */}
      <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-700 space-y-1">
          <p className="font-semibold text-teal-900">
            Nomor Registrasi (REG-YYYYMMDD-XXX) & Antrean Otomatis
          </p>
          <p className="text-slate-600 leading-relaxed text-sm max-w-[65ch]">
            Nomor Registrasi Kunjungan dan Antrean Poli akan digenerate otomatis oleh sistem setelah formulir disimpan dengan status awal <span className="font-semibold text-amber-700">Menunggu</span>.
          </p>
        </div>
      </div>

      {/* Main Registration Form */}
      <form onSubmit={handleOpenConfirmation} className="space-y-6">
        {/* Card Section 1: Data Pasien & Tujuan Poli */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="h-5 w-5 text-teal-600" />
                <span>Pilih Pasien & Tujuan Pemeriksaan</span>
              </CardTitle>
              <CardDescription className="text-sm text-slate-500 max-w-[65ch] mt-1">
                Pilih identitas pasien terdaftar serta tentukan poli dan dokter yang dituju.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {/* Pilih Pasien (Combobox Popup Autocomplete) */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-800 flex items-center justify-between min-h-[20px]">
                <span>Pilih Pasien Terdaftar <span className="text-red-500">*</span></span>
                {isLoadingPatients && (
                  <span className="text-xs text-slate-400 flex items-center gap-1 font-normal">
                    <Loader2 className="h-3 w-3 animate-spin" /> Memuat pasien...
                  </span>
                )}
              </Label>

              <Combobox
                items={patients}
                value={patients.find((p) => String(p.id) === String(formData.patient_id)) || null}
                onValueChange={(val) => {
                  setFormData((prev) => ({ ...prev, patient_id: val ? String(val.id) : '' }));
                  if (errors.patient_id) setErrors((prev) => ({ ...prev, patient_id: null }));
                }}
                itemToStringLabel={(patient) => (patient ? `${patient.name} (${patient.medical_record_number})` : '')}
                itemToStringValue={(patient) => (patient ? String(patient.id) : '')}
                isItemEqualToValue={(a, b) => a?.id === b?.id}
                disabled={isLoadingPatients}
              >
                <ComboboxTrigger className={errors.patient_id ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                  <ComboboxValue placeholder="Cari atau pilih pasien berdasar Nama / No. RM / NIK...">
                    {(selectedPatient) => (selectedPatient ? (
                      <span className="font-medium text-slate-900">
                        {selectedPatient.name} <span className="text-slate-500 font-normal">({selectedPatient.medical_record_number})</span>
                      </span>
                    ) : null)}
                  </ComboboxValue>
                </ComboboxTrigger>

                <ComboboxContent>
                  <div className="p-2 border-b border-slate-100 bg-white sticky top-0 z-10">
                    <ComboboxInput placeholder="Ketik nama, No. RM, atau NIK..." />
                  </div>
                  <ComboboxEmpty>Pasien tidak ditemukan.</ComboboxEmpty>
                  <ComboboxList>
                    {(patient) => (
                      <ComboboxItem key={patient.id} value={patient}>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{patient.name}</span>
                          <span className="text-xs text-slate-500 font-normal">
                            No. RM: {patient.medical_record_number} • NIK: {patient.nik}
                          </span>
                        </div>
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              {errors.patient_id && (
                <p className="text-xs font-medium text-red-600">{errors.patient_id}</p>
              )}
            </div>

            {/* Row 2: Poli Tujuan & Dokter Pemeriksa */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              {/* Poli / Departemen Klinik (menggunakan const CLINIC_DEPARTMENTS) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800 flex items-center justify-between min-h-[20px]">
                  <span>Poli / Departemen Tujuan <span className="text-red-500">*</span></span>
                </Label>
                <Select
                  value={formData.clinic_department}
                  onValueChange={(val) => {
                    setFormData((prev) => ({ ...prev, clinic_department: val }));
                    if (errors.clinic_department) setErrors((prev) => ({ ...prev, clinic_department: null }));
                  }}
                >
                  <SelectTrigger
                    className={`w-full h-10 text-sm bg-white ${
                      errors.clinic_department ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'
                    }`}
                  >
                    <SelectValue placeholder="Pilih Poli Tujuan..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectGroup>
                      {CLINIC_DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept.code} value={dept.name} className="text-sm py-2">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-slate-400" />
                            <span>{dept.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {errors.clinic_department && (
                  <p className="text-xs font-medium text-red-600">{errors.clinic_department}</p>
                )}
              </div>

              {/* Dokter Pemeriksa (Combobox Popup) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800 flex items-center justify-between min-h-[20px]">
                  <span>Dokter Pemeriksa <span className="text-red-500">*</span></span>
                  {isLoadingDoctors && (
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-normal">
                      <Loader2 className="h-3 w-3 animate-spin" /> Memuat dokter...
                    </span>
                  )}
                </Label>
                <Combobox
                  items={doctors}
                  value={doctors.find((d) => String(d.id) === String(formData.doctor_id)) || null}
                  onValueChange={(val) => {
                    setFormData((prev) => ({ ...prev, doctor_id: val ? String(val.id) : '' }));
                    if (errors.doctor_id) setErrors((prev) => ({ ...prev, doctor_id: null }));
                  }}
                  itemToStringLabel={(doc) => (doc ? doc.name : '')}
                  itemToStringValue={(doc) => (doc ? String(doc.id) : '')}
                  isItemEqualToValue={(a, b) => a?.id === b?.id}
                  disabled={isLoadingDoctors}
                >
                  <ComboboxTrigger className={errors.doctor_id ? 'border-red-500 focus-visible:ring-red-500' : ''}>
                    <ComboboxValue placeholder="Pilih Dokter Pemeriksa...">
                      {(selectedDoctor) => (selectedDoctor ? (
                        <div className="flex items-center justify-between w-full pr-2">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="h-4 w-4 text-teal-600 shrink-0" />
                            <span className="font-medium text-slate-900">{selectedDoctor.name}</span>
                          </div>
                          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                            {selectedDoctor.active_patients_today} pasien aktif
                          </span>
                        </div>
                      ) : null)}
                    </ComboboxValue>
                  </ComboboxTrigger>

                  <ComboboxContent>
                    <div className="p-2 border-b border-slate-100 bg-white sticky top-0 z-10">
                      <ComboboxInput placeholder="Ketik nama dokter..." />
                    </div>
                    <ComboboxEmpty>Dokter tidak ditemukan.</ComboboxEmpty>
                    <ComboboxList>
                      {(doc) => (
                        <ComboboxItem key={doc.id} value={doc}>
                          <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-4 w-4 text-teal-600 shrink-0" />
                              <span className="font-medium text-slate-900">{doc.name}</span>
                            </div>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                              {doc.active_patients_today} pasien aktif
                            </span>
                          </div>
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                {errors.doctor_id && (
                  <p className="text-xs font-medium text-red-600">{errors.doctor_id}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Section 2: Detail Kunjungan & Pembayaran */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-teal-600" />
              <span>Pembayaran & Detail Kunjungan</span>
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 max-w-[65ch]">
              Tentukan jenis penjamin pembayaran, tanggal kunjungan, serta keluhan awal pasien.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {/* Row 1: Jenis Pembayaran & Tanggal Kunjungan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Jenis Pembayaran */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800 block">
                  Jenis Pembayaran <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.payment_type}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, payment_type: value }));
                    if (errors.payment_type) setErrors((prev) => ({ ...prev, payment_type: null }));
                  }}
                  className="flex gap-3 pt-1"
                >
                  {['Umum', 'BPJS', 'Asuransi'].map((type) => {
                    const isSelected = formData.payment_type === type;
                    return (
                      <label
                        key={type}
                        htmlFor={`pay-${type}`}
                        className={`flex items-center gap-2 border rounded-lg p-2.5 flex-1 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-semibold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <RadioGroupItem value={type} id={`pay-${type}`} />
                        <span className="text-sm">{type}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
                {errors.payment_type && (
                  <p className="text-xs font-medium text-red-600">{errors.payment_type}</p>
                )}
              </div>

              {/* Tanggal Kunjungan */}
              <div className="space-y-2">
                <Label htmlFor="visit_date" className="text-sm font-semibold text-slate-800">
                  Tanggal Kunjungan <span className="text-red-500">*</span>
                </Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="visit_date"
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full h-10 justify-start text-left font-normal text-sm border-slate-200 shadow-none bg-white',
                        !formData.visit_date && 'text-slate-400',
                        errors.visit_date && 'border-red-500 focus-visible:ring-red-500'
                      )}
                    >
                      <CalendarIcon className="mr-2.5 h-4 w-4 text-slate-500 shrink-0" />
                      {formData.visit_date ? (
                        <span className="font-medium text-slate-900">
                          {format(new Date(formData.visit_date + 'T00:00:00'), 'dd MMMM yyyy', { locale: idLocale })}
                        </span>
                      ) : (
                        <span>Pilih tanggal kunjungan...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border border-slate-200 shadow-lg rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.visit_date ? new Date(formData.visit_date + 'T00:00:00') : undefined}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          const year = selectedDate.getFullYear();
                          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                          const day = String(selectedDate.getDate()).padStart(2, '0');
                          const formattedDate = `${year}-${month}-${day}`;
                          setFormData((prev) => ({ ...prev, visit_date: formattedDate }));
                          if (errors.visit_date) setErrors((prev) => ({ ...prev, visit_date: null }));
                        }
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.visit_date && (
                  <p className="text-xs font-medium text-red-600">{errors.visit_date}</p>
                )}
              </div>
            </div>

            {/* Keluhan Utama / Alasan Kedatangan */}
            <div className="space-y-2">
              <Label htmlFor="initial_complaint" className="text-sm font-semibold text-slate-800">
                Keluhan Utama Pasien <span className="text-xs text-slate-400 font-normal">(Opsional)</span>
              </Label>
              <Textarea
                id="initial_complaint"
                name="initial_complaint"
                rows={3}
                value={formData.initial_complaint}
                onChange={handleChange}
                className="text-sm border-slate-200 resize-none leading-relaxed"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/registrations')}
            disabled={isSubmitting}
            className="h-10 px-5 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Batal
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-10 px-6 text-sm font-medium gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Daftarkan Pasien Berobat</span>
          </Button>
        </div>
      </form>

      {/* Media Alert Dialog for Confirming Patient Visit Registration */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="max-w-md bg-white rounded-xl shadow-xl border border-slate-200">
          <AlertDialogHeader className="items-center text-center sm:items-start sm:text-left">
            <AlertDialogMedia className="mb-2">
              <ClipboardList className="h-6 w-6 text-teal-600" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              Konfirmasi Pendaftaran Berobat
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 leading-relaxed pt-1">
              Mohon pastikan seluruh data pendaftaran kunjungan berobat pasien di bawah ini sudah sesuai.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Registration Summary Card */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-sm space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Pasien</span>
              <span className="font-semibold text-slate-900">
                {selectedPatient ? selectedPatient.name : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">No. Rekam Medis</span>
              <span className="font-semibold text-slate-800">
                {selectedPatient ? selectedPatient.medical_record_number : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Poli Tujuan</span>
              <span className="font-semibold text-slate-900">{formData.clinic_department}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Dokter Pemeriksa</span>
              <span className="font-medium text-slate-800">
                {selectedDoctor ? selectedDoctor.name : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Jenis Pembayaran</span>
              <span className="font-medium text-slate-800">{formData.payment_type}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tanggal Kunjungan</span>
              <span className="font-medium text-slate-800">
                {formData.visit_date
                  ? format(new Date(formData.visit_date + 'T00:00:00'), 'dd MMMM yyyy', { locale: idLocale })
                  : '-'}
              </span>
            </div>
            {formData.initial_complaint && (
              <div className="flex justify-between items-start pt-1 border-t border-slate-200/70">
                <span className="text-slate-500 shrink-0">Keluhan Awal</span>
                <span className="font-medium text-slate-800 text-right max-w-[200px]">
                  {formData.initial_complaint}
                </span>
              </div>
            )}
          </div>

          <AlertDialogFooter className="pt-2 gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={isSubmitting}
              className="text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none"
            >
              Periksa Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeCreateRegistration}
              disabled={isSubmitting}
              className="text-sm font-medium gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ya, Daftarkan Pasien</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
