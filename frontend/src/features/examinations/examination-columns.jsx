import * as React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  ArrowUpDown,
  Stethoscope,
  FileText,
  Building2,
  Clock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const columnHelper = createColumnHelper();

export const formatQueueNumber = (num) => {
  if (!num) return '-';
  const clean = String(num).trim();
  if (/^[A-Za-z]\d{3}$/.test(clean)) {
    return `${clean[0].toUpperCase()}-${clean.slice(1)}`;
  }
  return clean;
};

export const getExaminationStatusBadgeClass = (status) => {
  switch (status) {
    case 'Menunggu':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'Check In':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case 'Pemeriksaan':
      return 'bg-purple-50 text-purple-800 border-purple-300';
    case 'Selesai':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const createExaminationColumns = ({
  onStartExamination,
  onViewMedicalRecord,
}) => {
  return columnHelper.columns([
    // 1. Nomor Antrean
    columnHelper.accessor((row) => row.queue_number || row.queue?.queue_number || '', {
      id: 'queue_number',
      header: () => (
        <div className="text-center font-semibold text-sm text-slate-700 whitespace-nowrap">
          No. Antrean
        </div>
      ),
      cell: ({ row }) => {
        const raw = row.original.queue_number || row.original.queue?.queue_number;
        const formatted = formatQueueNumber(raw);
        return (
          <div className="flex justify-center whitespace-nowrap">
            <Badge
              variant="outline"
              className="bg-teal-50 text-teal-800 border-teal-300 px-2.5 py-1 text-sm font-bold tracking-wide shadow-none whitespace-nowrap"
            >
              {formatted}
            </Badge>
          </div>
        );
      },
    }),

    // 2. Nomor Registrasi
    columnHelper.accessor('registration_number', {
      header: () => (
        <div className="text-center font-semibold text-sm text-slate-700 whitespace-nowrap">
          No. Registrasi
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium text-sm text-slate-800 whitespace-nowrap">
          {row.getValue('registration_number') || '-'}
        </div>
      ),
    }),

    // 3. Nama Pasien
    columnHelper.accessor((row) => row.patient_name || row.patient?.name || '', {
      id: 'patient_name',
      header: () => (
        <div className="text-center font-semibold text-sm text-slate-700 whitespace-nowrap">
          Nama Pasien
        </div>
      ),
      cell: ({ row }) => {
        const name = row.original.patient_name || row.original.patient?.name || '-';
        return (
          <div className="text-center font-semibold text-sm text-slate-900 leading-snug whitespace-nowrap">
            {name}
          </div>
        );
      },
    }),

    // 4. Jenis Kelamin (L/P)
    columnHelper.accessor((row) => row.patient_gender || row.patient?.gender || '', {
      id: 'gender',
      header: () => <div className="text-center font-semibold text-sm text-slate-700 whitespace-nowrap">L/P</div>,
      cell: ({ row }) => {
        const gender = row.original.patient_gender || row.original.patient?.gender;
        if (!gender) return <div className="text-center text-slate-400 text-sm whitespace-nowrap">-</div>;
        const isMale = gender === 'L' || gender === 'Male';
        return (
          <div className="flex justify-center whitespace-nowrap">
            <Badge
              variant="outline"
              className={
                isMale
                  ? 'bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold px-2 py-0.5 whitespace-nowrap'
                  : 'bg-pink-50 text-pink-700 border-pink-200 text-xs font-semibold px-2 py-0.5 whitespace-nowrap'
              }
            >
              {isMale ? 'L' : 'P'}
            </Badge>
          </div>
        );
      },
    }),

    // 5. Nomor Rekam Medis
    columnHelper.accessor((row) => row.medical_record_number || row.patient?.medical_record_number || '', {
      id: 'medical_record_number',
      header: () => (
        <div className="text-center font-semibold text-sm text-slate-700 whitespace-nowrap">
          No. Rekam Medis
        </div>
      ),
      cell: ({ row }) => {
        const mrn = row.original.medical_record_number || row.original.patient?.medical_record_number;
        return (
          <div className="text-center font-medium text-sm text-slate-700 whitespace-nowrap">
            {mrn || '-'}
          </div>
        );
      },
    }),

    // 6. Poli Tujuan
    columnHelper.accessor('clinic_department', {
      header: () => (
        <div className="text-center font-semibold text-sm text-slate-700 whitespace-nowrap">
          Poli Tujuan
        </div>
      ),
      cell: ({ row }) => {
        const dept = row.getValue('clinic_department');
        return (
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700 whitespace-nowrap">
            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="whitespace-nowrap">{dept || '-'}</span>
          </div>
        );
      },
    }),

    // 7. Keluhan Awal
    columnHelper.accessor('initial_complaint', {
      header: () => (
        <div className="text-center font-semibold text-sm text-slate-700 whitespace-nowrap">
          Keluhan Awal
        </div>
      ),
      cell: ({ row }) => {
        const complaint = row.getValue('initial_complaint');
        return (
          <div
            className="text-center text-sm text-slate-600 truncate max-w-[200px] mx-auto"
            title={complaint || ''}
          >
            {complaint || '-'}
          </div>
        );
      },
    }),

    // 8. Status Kunjungan
    columnHelper.accessor('status', {
      header: () => (
        <div className="text-center font-semibold text-sm text-slate-700 whitespace-nowrap">
          Status
        </div>
      ),
      cell: ({ row }) => {
        const status = row.getValue('status');
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={`${getExaminationStatusBadgeClass(status)} text-xs font-semibold px-2.5 py-0.5 whitespace-nowrap`}
            >
              {status}
            </Badge>
          </div>
        );
      },
    }),

    // 9. Kolom Aksi
    columnHelper.display({
      id: 'actions',
      header: () => (
        <div className="text-center font-semibold text-sm text-slate-700 whitespace-nowrap">
          Aksi
        </div>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const status = item.status;

        // Pasien Siap Periksa / Sedang Diperiksa
        if (status === 'Check In' || status === 'Pemeriksaan') {
          return (
            <div className="flex items-center justify-center whitespace-nowrap">
              <Button
                size="sm"
                onClick={() => onStartExamination && onStartExamination(item)}
                className="h-8 px-3 text-xs sm:text-sm gap-1.5 font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-none whitespace-nowrap"
                title="Mulai pemeriksaan medis SOAP untuk pasien ini"
              >
                <Stethoscope className="h-3.5 w-3.5 text-teal-100" />
                <span>{status === 'Pemeriksaan' ? 'Lanjutkan SOAP' : 'Periksa Pasien'}</span>
              </Button>
            </div>
          );
        }

        // Pasien Selesai Periksa
        if (status === 'Selesai') {
          return (
            <div className="flex items-center justify-center whitespace-nowrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewMedicalRecord && onViewMedicalRecord(item)}
                className="h-8 px-3 text-xs sm:text-sm gap-1.5 font-medium border-slate-200 text-slate-700 hover:bg-slate-100 shadow-none whitespace-nowrap"
                title="Lihat riwayat hasil pemeriksaan SOAP pasien ini"
              >
                <FileText className="h-3.5 w-3.5 text-slate-500" />
                <span>Lihat SOAP</span>
              </Button>
            </div>
          );
        }

        // Status Menunggu (Belum dipanggil di loket)
        return (
          <div className="flex items-center justify-center text-xs text-slate-400 font-medium">
            <span>Belum Check In</span>
          </div>
        );
      },
    }),
  ]);
};
