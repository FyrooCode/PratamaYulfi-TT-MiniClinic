import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/context/NotificationContext';
import { medicalRecordsApi } from '@/api/medical-records.api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,
  Activity,
  HeartPulse,
  Thermometer,
  Scale,
  Ruler,
  Pill,
  Plus,
  Trash2,
  Copy,
  Save,
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle2,
} from 'lucide-react';

export default function SoapExaminationForm({ registration, onSuccess, onCancel }) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const isDoctor = user?.role === 'doctor';

  const [formData, setFormData] = useState({
    subjective: registration?.initial_complaint || '',
    systolic_bp: '',
    diastolic_bp: '',
    temperature: '',
    weight: '',
    height: '',
    assessment: '',
    plan: '',
    medical_actions: '',
    prescription: '',
  });

  const [medicines, setMedicines] = useState([
    {
      medicine_name: '',
      dosage: '',
      frequency: '',
      quantity: '1',
      instructions: '',
    },
  ]);

  const [fieldErrors, setFieldErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle standard input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  // Medicine list handlers
  const handleAddMedicine = () => {
    setMedicines((prev) => [
      ...prev,
      {
        medicine_name: '',
        dosage: '',
        frequency: '',
        quantity: '1',
        instructions: '',
      },
    ]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });

    const errorKey = `medicines[${index}].${field}`;
    if (fieldErrors[errorKey]) {
      setFieldErrors((prev) => ({
        ...prev,
        [errorKey]: null,
      }));
    }
  };

  // Live BMI calculation
  const calculateBmi = () => {
    const w = parseFloat(formData.weight);
    const h = parseFloat(formData.height) / 100; // to meters
    if (w > 0 && h > 0) {
      const bmi = (w / (h * h)).toFixed(1);
      let category = 'Normal';
      let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      if (bmi < 18.5) {
        category = 'Berat Kurang';
        badgeColor = 'bg-blue-50 text-blue-700 border-blue-300';
      } else if (bmi >= 25 && bmi < 30) {
        category = 'Kelebihan Berat';
        badgeColor = 'bg-amber-50 text-amber-700 border-amber-300';
      } else if (bmi >= 30) {
        category = 'Obesitas';
        badgeColor = 'bg-rose-50 text-rose-700 border-rose-300';
      }
      return { bmi, category, badgeColor };
    }
    return null;
  };

  const bmiData = calculateBmi();

  // Validate form client-side
  const validateForm = () => {
    const errors = {};

    if (!formData.subjective.trim()) {
      errors.subjective = 'Keluhan Subjektif [S] wajib diisi';
    }

    if (!formData.assessment.trim()) {
      errors.assessment = 'Diagnosis Asesmen [A] wajib diisi';
    }

    if (!formData.plan.trim()) {
      errors.plan = 'Rencana Terapi / Plan [P] wajib diisi';
    }

    // Optional vitals range checks
    if (formData.systolic_bp) {
      const sys = parseInt(formData.systolic_bp, 10);
      if (isNaN(sys) || sys < 1 || sys > 350) {
        errors.systolic_bp = 'Sistolik harus antara 1-350 mmHg';
      }
    }

    if (formData.diastolic_bp) {
      const dia = parseInt(formData.diastolic_bp, 10);
      if (isNaN(dia) || dia < 1 || dia > 250) {
        errors.diastolic_bp = 'Diastolik harus antara 1-250 mmHg';
      }
    }

    if (formData.temperature) {
      const temp = parseFloat(formData.temperature);
      if (isNaN(temp) || temp < 25.0 || temp > 45.0) {
        errors.temperature = 'Suhu harus antara 25.0 - 45.0 °C';
      }
    }

    if (formData.weight) {
      const wt = parseFloat(formData.weight);
      if (isNaN(wt) || wt <= 0 || wt > 500) {
        errors.weight = 'Berat badan harus antara 1 - 500 kg';
      }
    }

    if (formData.height) {
      const ht = parseFloat(formData.height);
      if (isNaN(ht) || ht <= 0 || ht > 300) {
        errors.height = 'Tinggi badan harus antara 1 - 300 cm';
      }
    }

    // Validate medicines only if rows exist and have any field filled
    medicines.forEach((med, idx) => {
      const hasAnyValue = med.medicine_name || med.dosage || med.frequency || med.instructions;
      if (hasAnyValue) {
        if (!med.medicine_name.trim()) {
          errors[`medicines[${idx}].medicine_name`] = 'Nama obat wajib diisi';
        }
        if (!med.dosage.trim()) {
          errors[`medicines[${idx}].dosage`] = 'Dosis obat wajib diisi';
        }
        if (!med.frequency.trim()) {
          errors[`medicines[${idx}].frequency`] = 'Aturan pakai wajib diisi';
        }
      }
    });

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isDoctor) {
      showNotification({
        type: 'error',
        title: 'Akses Ditolak',
        message: 'Hanya akun dengan peran Dokter yang dapat menyimpan rekam medis (SOAP).',
      });
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showNotification({
        type: 'error',
        title: 'Form Belum Lengkap',
        message: 'Mohon periksa dan lengkapi kolom bertanda merah sebelum menyimpan.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter valid medicines
      const validMedicines = medicines
        .filter((med) => med.medicine_name.trim() && med.dosage.trim() && med.frequency.trim())
        .map((med) => ({
          medicine_name: med.medicine_name.trim(),
          dosage: med.dosage.trim(),
          frequency: med.frequency.trim(),
          quantity: parseInt(med.quantity, 10) || 1,
          instructions: med.instructions?.trim() || null,
        }));

      const payload = {
        registration_id: registration.id,
        subjective: formData.subjective.trim(),
        systolic_bp: formData.systolic_bp ? parseInt(formData.systolic_bp, 10) : null,
        diastolic_bp: formData.diastolic_bp ? parseInt(formData.diastolic_bp, 10) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        assessment: formData.assessment.trim(),
        plan: formData.plan.trim(),
        medical_actions: formData.medical_actions?.trim() || null,
        prescription: formData.prescription?.trim() || null,
        medicines: validMedicines.length > 0 ? validMedicines : undefined,
      };

      const res = await medicalRecordsApi.create(payload);

      if (res.success) {
        showNotification({
          type: 'success',
          title: 'Pemeriksaan Selesai',
          message: 'Rekam medis SOAP dan resep berhasil dicatat. Status kunjungan telah diselesaikan.',
        });

        if (onSuccess) {
          onSuccess(res.data);
        }
      }
    } catch (err) {
      const serverErrors = err.response?.data?.errors;
      if (serverErrors && typeof serverErrors === 'object') {
        setFieldErrors(serverErrors);
      }
      showNotification({
        type: 'error',
        title: 'Gagal Menyimpan Rekam Medis',
        message: err.response?.data?.message || 'Terjadi kesalahan saat memproses pemeriksaan.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Stethoscope className="h-5 w-5 text-teal-600" />
          <div>
            <CardTitle className="text-base font-bold text-slate-900">
              Formulir Pemeriksaan Medis (SOAP)
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Input diagnosis klinis, pemeriksaan fisik, dan resep terapi obat untuk kunjungan ini.
            </p>
          </div>
        </div>

        {!isDoctor && (
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-800 border-amber-300 text-xs font-semibold px-2.5 py-1 gap-1.5"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
            Hanya Dokter yang dapat Menyimpan
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION S: SUBJEKTIF */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs px-2.5 py-0.5 shadow-none">
                  S
                </Badge>
                <span className="text-sm font-bold text-slate-900">
                  Subjektif (Anamnesis & Keluhan Utama)
                </span>
                <span className="text-rose-500 text-sm font-bold">*</span>
              </div>

              {registration?.initial_complaint && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      subjective: registration.initial_complaint,
                    }))
                  }
                  className="h-7 text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-50 gap-1.5 px-2"
                >
                  <Copy className="h-3 w-3" />
                  Salin dari Keluhan Awal
                </Button>
              )}
            </div>

            <div>
              <Textarea
                name="subjective"
                rows={3}
                placeholder="Deskripsikan keluhan utama pasien, onset durasi gejala, riwayat alergi, atau faktor pemicu..."
                value={formData.subjective}
                onChange={handleChange}
                className={`bg-white text-sm ${
                  fieldErrors.subjective ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                }`}
              />
              {fieldErrors.subjective && (
                <p className="text-xs text-rose-600 font-medium mt-1">
                  {fieldErrors.subjective}
                </p>
              )}
            </div>
          </div>

          {/* SECTION O: OBJEKTIF (TANDA VITAL) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-2.5 py-0.5 shadow-none">
                  O
                </Badge>
                <span className="text-sm font-bold text-slate-900">
                  Objektif (Tanda Vital & Pemeriksaan Fisik)
                </span>
                <span className="text-xs text-slate-400 font-normal ml-1">
                  (Opsional tapi dianjurkan)
                </span>
              </div>

              {bmiData && (
                <Badge
                  variant="outline"
                  className={`text-xs font-semibold px-2.5 py-0.5 ${bmiData.badgeColor}`}
                >
                  BMI: {bmiData.bmi} kg/m² ({bmiData.category})
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {/* Systolic */}
              <div>
                <Label className="text-xs text-slate-600 flex items-center gap-1 mb-1">
                  <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                  Sistolik (mmHg)
                </Label>
                <Input
                  type="number"
                  name="systolic_bp"
                  placeholder="120"
                  min="1"
                  max="350"
                  value={formData.systolic_bp}
                  onChange={handleChange}
                  className={`bg-white text-sm h-9 ${
                    fieldErrors.systolic_bp ? 'border-rose-500' : ''
                  }`}
                />
                {fieldErrors.systolic_bp && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.systolic_bp}</p>
                )}
              </div>

              {/* Diastolic */}
              <div>
                <Label className="text-xs text-slate-600 flex items-center gap-1 mb-1">
                  <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
                  Diastolik (mmHg)
                </Label>
                <Input
                  type="number"
                  name="diastolic_bp"
                  placeholder="80"
                  min="1"
                  max="250"
                  value={formData.diastolic_bp}
                  onChange={handleChange}
                  className={`bg-white text-sm h-9 ${
                    fieldErrors.diastolic_bp ? 'border-rose-500' : ''
                  }`}
                />
                {fieldErrors.diastolic_bp && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.diastolic_bp}</p>
                )}
              </div>

              {/* Temperature */}
              <div>
                <Label className="text-xs text-slate-600 flex items-center gap-1 mb-1">
                  <Thermometer className="h-3.5 w-3.5 text-amber-500" />
                  Suhu Tubuh (°C)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  name="temperature"
                  placeholder="36.5"
                  min="25"
                  max="45"
                  value={formData.temperature}
                  onChange={handleChange}
                  className={`bg-white text-sm h-9 ${
                    fieldErrors.temperature ? 'border-rose-500' : ''
                  }`}
                />
                {fieldErrors.temperature && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.temperature}</p>
                )}
              </div>

              {/* Weight */}
              <div>
                <Label className="text-xs text-slate-600 flex items-center gap-1 mb-1">
                  <Scale className="h-3.5 w-3.5 text-teal-600" />
                  Berat Badan (kg)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  name="weight"
                  placeholder="65"
                  min="1"
                  max="500"
                  value={formData.weight}
                  onChange={handleChange}
                  className={`bg-white text-sm h-9 ${
                    fieldErrors.weight ? 'border-rose-500' : ''
                  }`}
                />
                {fieldErrors.weight && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.weight}</p>
                )}
              </div>

              {/* Height */}
              <div>
                <Label className="text-xs text-slate-600 flex items-center gap-1 mb-1">
                  <Ruler className="h-3.5 w-3.5 text-indigo-500" />
                  Tinggi Badan (cm)
                </Label>
                <Input
                  type="number"
                  step="0.1"
                  name="height"
                  placeholder="170"
                  min="1"
                  max="300"
                  value={formData.height}
                  onChange={handleChange}
                  className={`bg-white text-sm h-9 ${
                    fieldErrors.height ? 'border-rose-500' : ''
                  }`}
                />
                {fieldErrors.height && (
                  <p className="text-[11px] text-rose-600 mt-0.5">{fieldErrors.height}</p>
                )}
              </div>
            </div>
          </div>

          {/* SECTION A: ASESMEN / DIAGNOSIS */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-2.5 py-0.5 shadow-none">
                A
              </Badge>
              <span className="text-sm font-bold text-slate-900">
                Asesmen (Diagnosis Kerja Dokter)
              </span>
              <span className="text-rose-500 text-sm font-bold">*</span>
            </div>

            <div>
              <Textarea
                name="assessment"
                rows={2}
                placeholder="Tuliskan diagnosis klinis utama / diagnosis banding (misal: ISPA Akut, Faringitis Akut, Dispepsia)..."
                value={formData.assessment}
                onChange={handleChange}
                className={`bg-white text-sm ${
                  fieldErrors.assessment ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                }`}
              />
              {fieldErrors.assessment && (
                <p className="text-xs text-rose-600 font-medium mt-1">
                  {fieldErrors.assessment}
                </p>
              )}
            </div>
          </div>

          {/* SECTION P: PLAN & TINDAKAN */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-2.5 py-0.5 shadow-none">
                P
              </Badge>
              <span className="text-sm font-bold text-slate-900">
                Plan (Rencana Terapi & Tindakan Medis)
              </span>
              <span className="text-rose-500 text-sm font-bold">*</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-xs text-slate-700 font-medium mb-1 block">
                  Rencana Terapi / Edukasi Pasien <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  name="plan"
                  rows={2}
                  placeholder="Rencana pengobatan, istirahat, kontrol ulang, atau instruksi diet..."
                  value={formData.plan}
                  onChange={handleChange}
                  className={`bg-white text-sm ${
                    fieldErrors.plan ? 'border-rose-500 focus-visible:ring-rose-500' : ''
                  }`}
                />
                {fieldErrors.plan && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{fieldErrors.plan}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <Label className="text-xs text-slate-700 font-medium mb-1 block">
                    Tindakan Medis Tambahan (Opsional)
                  </Label>
                  <Input
                    name="medical_actions"
                    placeholder="Contoh: Nebulisasi, Pembersihan Luka, Pasang Infus..."
                    value={formData.medical_actions}
                    onChange={handleChange}
                    className="bg-white text-sm h-9"
                  />
                </div>

                <div>
                  <Label className="text-xs text-slate-700 font-medium mb-1 block">
                    Catatan Resep Umum (Opsional)
                  </Label>
                  <Input
                    name="prescription"
                    placeholder="Contoh: Diminum sesudah makan, habiskan antibiotik..."
                    value={formData.prescription}
                    onChange={handleChange}
                    className="bg-white text-sm h-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION RESEP OBAT (PRESCRIPTIONS) */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-teal-600 text-white flex items-center justify-center">
                  <Pill className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    Daftar Resep Obat Pasien
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Resep obat otomatis tersimpan terstruktur ke apotek / farmasi.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddMedicine}
                className="h-8 text-xs font-semibold gap-1.5 text-teal-700 border-teal-300 hover:bg-teal-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Tambah Obat
              </Button>
            </div>

            {medicines.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500 bg-white rounded-lg border border-dashed border-slate-200">
                Tidak ada resep obat yang ditambahkan. Klik <strong>"Tambah Obat"</strong> jika ingin meresepkan obat.
              </div>
            ) : (
              <div className="space-y-3">
                {medicines.map((med, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-xs font-bold text-teal-800 flex items-center gap-1.5">
                        <span className="h-5 w-5 rounded-full bg-teal-100 text-teal-800 text-[11px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        Item Obat #{idx + 1}
                      </span>

                      {medicines.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMedicine(idx)}
                          className="h-7 w-7 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                          title="Hapus Obat"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
                      {/* Medicine Name (4 cols) */}
                      <div className="lg:col-span-4">
                        <Label className="text-[11px] text-slate-600 font-medium mb-1 block">
                          Nama Obat <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. Paracetamol 500mg"
                          value={med.medicine_name}
                          onChange={(e) =>
                            handleMedicineChange(idx, 'medicine_name', e.target.value)
                          }
                          className={`bg-white text-xs h-8.5 ${
                            fieldErrors[`medicines[${idx}].medicine_name`]
                              ? 'border-rose-500'
                              : ''
                          }`}
                        />
                        {fieldErrors[`medicines[${idx}].medicine_name`] && (
                          <p className="text-[10px] text-rose-600 mt-0.5">
                            {fieldErrors[`medicines[${idx}].medicine_name`]}
                          </p>
                        )}
                      </div>

                      {/* Dosage (2 cols) */}
                      <div className="lg:col-span-2">
                        <Label className="text-[11px] text-slate-600 font-medium mb-1 block">
                          Dosis <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. 500 mg / 1 tab"
                          value={med.dosage}
                          onChange={(e) => handleMedicineChange(idx, 'dosage', e.target.value)}
                          className={`bg-white text-xs h-8.5 ${
                            fieldErrors[`medicines[${idx}].dosage`] ? 'border-rose-500' : ''
                          }`}
                        />
                        {fieldErrors[`medicines[${idx}].dosage`] && (
                          <p className="text-[10px] text-rose-600 mt-0.5">
                            {fieldErrors[`medicines[${idx}].dosage`]}
                          </p>
                        )}
                      </div>

                      {/* Frequency (3 cols) */}
                      <div className="lg:col-span-3">
                        <Label className="text-[11px] text-slate-600 font-medium mb-1 block">
                          Aturan Pakai <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          placeholder="e.g. 3x1 sesudah makan"
                          value={med.frequency}
                          onChange={(e) =>
                            handleMedicineChange(idx, 'frequency', e.target.value)
                          }
                          className={`bg-white text-xs h-8.5 ${
                            fieldErrors[`medicines[${idx}].frequency`] ? 'border-rose-500' : ''
                          }`}
                        />
                        {fieldErrors[`medicines[${idx}].frequency`] && (
                          <p className="text-[10px] text-rose-600 mt-0.5">
                            {fieldErrors[`medicines[${idx}].frequency`]}
                          </p>
                        )}
                      </div>

                      {/* Quantity (1 col) */}
                      <div className="lg:col-span-1">
                        <Label className="text-[11px] text-slate-600 font-medium mb-1 block">
                          Jumlah
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          placeholder="10"
                          value={med.quantity}
                          onChange={(e) =>
                            handleMedicineChange(idx, 'quantity', e.target.value)
                          }
                          className="bg-white text-xs h-8.5"
                        />
                      </div>

                      {/* Instructions (2 cols) */}
                      <div className="lg:col-span-2">
                        <Label className="text-[11px] text-slate-600 font-medium mb-1 block">
                          Petunjuk
                        </Label>
                        <Input
                          placeholder="e.g. Bila demam"
                          value={med.instructions}
                          onChange={(e) =>
                            handleMedicineChange(idx, 'instructions', e.target.value)
                          }
                          className="bg-white text-xs h-8.5"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Submission Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              Menyimpan formulir ini akan secara otomatis mengubah status kunjungan dan antrean menjadi{' '}
              <strong className="text-emerald-700">"Selesai"</strong>.
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="h-10 px-4 text-xs font-semibold text-slate-600"
                >
                  Batal
                </Button>
              )}

              <Button
                type="submit"
                disabled={isSubmitting || !isDoctor}
                className="h-10 px-5 text-xs sm:text-sm font-bold gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm flex-1 sm:flex-none"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Save className="h-4 w-4 text-teal-100" />
                )}
                <span>Simpan SOAP & Selesaikan Pemeriksaan</span>
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
