import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/context/NotificationContext';
import { patientsApi } from '@/api/patients.api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
  Pencil,
  Info,
  Phone,
  User,
  Calendar as CalendarIcon,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function EditPatientPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [isLoading, setIsLoading] = useState(true);
  const [patientData, setPatientData] = useState(null);

  const [formData, setFormData] = useState({
    nik: '',
    name: '',
    gender: 'L',
    dob: '',
    phone: '',
    address: '',
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RBAC Guard: Doctor cannot edit patients
  const canEdit = user?.role === 'admin' || user?.role === 'receptionist';

  // Fetch patient details on mount
  useEffect(() => {
    const fetchPatientDetails = async () => {
      setIsLoading(true);
      try {
        const res = await patientsApi.getById(id);
        if (res.success && res.data) {
          const p = res.data;
          setPatientData(p);

          // Standardize gender format ('Male'/'L' -> 'L', 'Female'/'P' -> 'P')
          let genderVal = 'L';
          if (p.gender === 'P' || p.gender === 'Female') genderVal = 'P';

          // Format DOB to YYYY-MM-DD for state
          let dobVal = '';
          if (p.dob) {
            dobVal = new Date(p.dob).toISOString().split('T')[0];
          }

          setFormData({
            nik: p.nik || '',
            name: p.name || '',
            gender: genderVal,
            dob: dobVal,
            phone: p.phone || '',
            address: p.address || '',
          });
        }
      } catch (err) {
        showNotification({
          type: 'error',
          title: 'Gagal Memuat Data Pasien',
          message: err.response?.data?.message || 'Data pasien tidak ditemukan atau server mengalami gangguan.',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchPatientDetails();
    }
  }, [id, showNotification]);

  if (!canEdit) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-lg">Akses Ditolak</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Hanya staf Resepsionis dan Admin yang memiliki izin untuk memperbarui data pasien.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate('/patients')}
              className="gap-2 border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Pasien
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <Loader2 className="h-8 w-8 text-teal-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600">Memuat data rekam medis pasien...</p>
      </div>
    );
  }

  if (!patientData) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <CardTitle className="text-lg">Pasien Tidak Ditemukan</CardTitle>
            </div>
            <CardDescription className="text-red-700">
              Data rekam medis pasien yang Anda cari tidak tersedia atau telah dihapus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => navigate('/patients')}
              className="gap-2 border-red-300 text-red-900 hover:bg-red-100"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Daftar Pasien
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

    // 1. NIK
    if (!formData.nik || !formData.nik.trim()) {
      newErrors.nik = 'NIK wajib diisi';
    } else if (!/^\d{16}$/.test(formData.nik.trim())) {
      newErrors.nik = 'NIK harus tepat 16 digit angka numerik';
    }

    // 2. Nama
    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Nama lengkap pasien wajib diisi';
    }

    // 3. Gender
    if (!formData.gender) {
      newErrors.gender = 'Pilih jenis kelamin pasien';
    }

    // 4. Tanggal Lahir
    if (!formData.dob) {
      newErrors.dob = 'Tanggal lahir wajib diisi';
    } else {
      const selectedDate = new Date(formData.dob);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.dob = 'Tanggal lahir tidak boleh di masa depan';
      }
    }

    // 5. Phone (optional)
    if (formData.phone && formData.phone.trim()) {
      if (!/^[0-9+\-\s()]{8,20}$/.test(formData.phone.trim())) {
        newErrors.phone = 'Format nomor telepon tidak valid';
      }
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

  const executeUpdatePatient = async () => {
    setIsSubmitting(true);

    try {
      const payload = {
        nik: formData.nik.trim(),
        name: formData.name.trim(),
        gender: formData.gender,
        dob: formData.dob,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
      };

      const res = await patientsApi.update(id, payload);

      if (res.success && res.data) {
        setIsConfirmDialogOpen(false);
        showNotification({
          type: 'success',
          title: 'Data Pasien Diperbarui',
          message: `Data pasien "${res.data.name}" (${res.data.medical_record_number}) berhasil diperbarui.`,
        });
        navigate('/patients');
      }
    } catch (err) {
      setIsConfirmDialogOpen(false);
      const responseData = err.response?.data;
      if (err.response?.status === 409) {
        setErrors((prev) => ({ ...prev, nik: 'NIK ini sudah digunakan oleh pasien lain' }));
        showNotification({
          type: 'error',
          title: 'NIK Sudah Digunakan',
          message: 'Nomor Induk Kependudukan (NIK) tersebut sudah tercatat untuk pasien lain.',
        });
      } else if (responseData?.errors) {
        setErrors(responseData.errors);
        showNotification({
          type: 'error',
          title: 'Gagal Memperbarui Data',
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Navigation & Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/patients')}
          className="gap-2 text-slate-600 hover:text-slate-900 -ml-2 mb-3 text-sm font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Master Pasien</span>
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <Pencil className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
                Edit Data Pasien
              </h1>
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded">
                {patientData.medical_record_number}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1 max-w-[65ch]">
              Perbarui informasi identitas induk rekam medis pasien di bawah ini.
            </p>
          </div>
        </div>
      </div>

      {/* Auto-generated MRN & Edit Info Banner */}
      <div className="rounded-lg border border-teal-200 bg-teal-50/60 p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-700 space-y-1">
          <p className="font-semibold text-teal-900">
            Nomor Rekam Medis (No. RM): {patientData.medical_record_number}
          </p>
          <p className="text-slate-600 leading-relaxed text-sm max-w-[65ch]">
            Nomor Rekam Medis pasien bersifat permanen dan tidak dapat diubah. Silakan perbarui data identitas utama pasien jika terdapat perubahan atau perbaikan data.
          </p>
        </div>
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleOpenConfirmation} className="space-y-6">
        {/* Card Section 1: Identitas Pasien */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-teal-600" />
              <span>Identitas Pasien</span>
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 max-w-[65ch]">
              Data identitas utama kependudukan pasien yang sah.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {/* Row 1: NIK & Nama Lengkap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* NIK */}
              <div className="space-y-2">
                <Label htmlFor="nik" className="text-sm font-semibold text-slate-800">
                  Nomor Induk Kependudukan (NIK) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nik"
                  name="nik"
                  type="text"
                  maxLength={16}
                  placeholder="Contoh: 3201012345670001 (16 digit)"
                  value={formData.nik}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData((prev) => ({ ...prev, nik: val }));
                    if (errors.nik) setErrors((prev) => ({ ...prev, nik: null }));
                  }}
                  className={`h-10 text-sm ${
                    errors.nik ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.nik ? (
                  <p className="text-xs font-medium text-red-600">{errors.nik}</p>
                ) : (
                  <p className="text-xs text-slate-400">Harus berupa 16 digit angka KTP / KK.</p>
                )}
              </div>

              {/* Nama Lengkap */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-semibold text-slate-800">
                  Nama Lengkap Pasien <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={formData.name}
                  onChange={handleChange}
                  className={`h-10 text-sm ${
                    errors.name ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'
                  }`}
                />
                {errors.name && (
                  <p className="text-xs font-medium text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            {/* Row 2: Jenis Kelamin & Tanggal Lahir */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Jenis Kelamin */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-800 block">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </Label>
                <RadioGroup
                  value={formData.gender}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, gender: value }));
                    if (errors.gender) setErrors((prev) => ({ ...prev, gender: null }));
                  }}
                  className="flex gap-4 pt-1"
                >
                  <label
                    htmlFor="gender-l"
                    className={`flex items-center gap-3 border rounded-lg p-3 flex-1 cursor-pointer transition-all ${
                      formData.gender === 'L'
                        ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <RadioGroupItem value="L" id="gender-l" />
                    <span className="text-sm">Laki-laki (L)</span>
                  </label>

                  <label
                    htmlFor="gender-p"
                    className={`flex items-center gap-3 border rounded-lg p-3 flex-1 cursor-pointer transition-all ${
                      formData.gender === 'P'
                        ? 'border-teal-600 bg-teal-50/50 text-teal-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <RadioGroupItem value="P" id="gender-p" />
                    <span className="text-sm">Perempuan (P)</span>
                  </label>
                </RadioGroup>
                {errors.gender && (
                  <p className="text-xs font-medium text-red-600">{errors.gender}</p>
                )}
              </div>

              {/* Tanggal Lahir */}
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-sm font-semibold text-slate-800">
                  Tanggal Lahir <span className="text-red-500">*</span>
                </Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      id="dob"
                      type="button"
                      variant="outline"
                      className={cn(
                        'w-full h-10 justify-start text-left font-normal text-sm border-slate-200 shadow-none bg-white',
                        !formData.dob && 'text-slate-400',
                        errors.dob && 'border-red-500 focus-visible:ring-red-500'
                      )}
                    >
                      <CalendarIcon className="mr-2.5 h-4 w-4 text-slate-500 shrink-0" />
                      {formData.dob ? (
                        <span className="font-medium text-slate-900">
                          {format(new Date(formData.dob + 'T00:00:00'), 'dd MMMM yyyy', { locale: idLocale })}
                        </span>
                      ) : (
                        <span>Pilih tanggal lahir...</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white border border-slate-200 shadow-lg rounded-xl" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      startMonth={new Date(1920, 0)}
                      endMonth={new Date()}
                      selected={formData.dob ? new Date(formData.dob + 'T00:00:00') : undefined}
                      onSelect={(selectedDate) => {
                        if (selectedDate) {
                          const year = selectedDate.getFullYear();
                          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                          const day = String(selectedDate.getDate()).padStart(2, '0');
                          const formattedDate = `${year}-${month}-${day}`;
                          setFormData((prev) => ({ ...prev, dob: formattedDate }));
                          if (errors.dob) setErrors((prev) => ({ ...prev, dob: null }));
                        } else {
                          setFormData((prev) => ({ ...prev, dob: '' }));
                        }
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {errors.dob ? (
                  <p className="text-xs font-medium text-red-600">{errors.dob}</p>
                ) : (
                  <p className="text-xs text-slate-400">Pilih hari, bulan, dan tahun kelahiran pasien.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card Section 2: Kontak & Alamat */}
        <Card className="border-slate-200 shadow-none">
          <CardHeader className="pb-4 border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Phone className="h-5 w-5 text-teal-600" />
              <span>Kontak & Alamat Domisili</span>
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 max-w-[65ch]">
              Informasi pendukung untuk keperluan komunikasi dan rekam data tempat tinggal pasien.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 space-y-5">
            {/* Nomor Telepon */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold text-slate-800">
                Nomor Telepon / WhatsApp <span className="text-xs text-slate-400 font-normal">(Opsional)</span>
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Contoh: 081234567890"
                value={formData.phone}
                onChange={handleChange}
                className={`max-w-md h-10 text-sm ${
                  errors.phone ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200'
                }`}
              />
              {errors.phone && (
                <p className="text-xs font-medium text-red-600">{errors.phone}</p>
              )}
            </div>

            {/* Alamat Domisili */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-semibold text-slate-800">
                Alamat Domisili Pasien <span className="text-xs text-slate-400 font-normal">(Opsional)</span>
              </Label>
              <div className="relative">
                <Textarea
                  id="address"
                  name="address"
                  rows={3}
                  placeholder="Contoh: Jl. Merdeka No. 12, Kel. Sukamaju, Kec. Bandung Barat"
                  value={formData.address}
                  onChange={handleChange}
                  className="text-sm border-slate-200 resize-none leading-relaxed"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/patients')}
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
            <span>Simpan Perubahan Data</span>
          </Button>
        </div>
      </form>

      {/* Media Alert Dialog for Confirming Patient Data Update */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent className="max-w-md bg-white rounded-xl shadow-xl border border-slate-200">
          <AlertDialogHeader className="items-center text-center sm:items-start sm:text-left">
            <AlertDialogMedia className="mb-2">
              <Pencil className="h-6 w-6 text-teal-600" />
            </AlertDialogMedia>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              Konfirmasi Perubahan Data Pasien
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-600 leading-relaxed pt-1">
              Apakah Anda yakin ingin memperbarui data rekam medis pasien di bawah ini?
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Patient Details Summary Card */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-sm space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">No. Rekam Medis</span>
              <span className="font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded text-xs">
                {patientData.medical_record_number}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Nama Pasien</span>
              <span className="font-semibold text-slate-900">{formData.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">NIK (16 Digit)</span>
              <span className="font-semibold text-slate-800">{formData.nik}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Jenis Kelamin</span>
              <span className="font-medium text-slate-800">
                {formData.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Tanggal Lahir</span>
              <span className="font-medium text-slate-800">
                {formData.dob
                  ? format(new Date(formData.dob + 'T00:00:00'), 'dd MMMM yyyy', { locale: idLocale })
                  : '-'}
              </span>
            </div>
            {formData.phone && (
              <div className="flex justify-between items-center">
                <span className="text-slate-500">No. Telepon</span>
                <span className="font-medium text-slate-800">{formData.phone}</span>
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
              onClick={executeUpdatePatient}
              disabled={isSubmitting}
              className="text-sm font-medium gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Ya, Simpan Perubahan</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
