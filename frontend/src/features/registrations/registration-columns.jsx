import * as React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowUpDown, Eye, XCircle, Calendar, Stethoscope, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const columnHelper = createColumnHelper();

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Menunggu':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Check In':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Pemeriksaan':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Selesai':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export const createRegistrationColumns = ({ onView, onCancel, canMutate = false }) => {
  return columnHelper.columns([
    columnHelper.accessor('registration_number', {
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm font-semibold text-slate-700 hover:text-slate-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            No. Registrasi
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-slate-600" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium text-sm text-slate-700">
          {row.getValue('registration_number')}
        </div>
      ),
    }),

    columnHelper.accessor((row) => row.patient?.name || '', {
      id: 'patient_name',
      header: () => <div className="text-center font-semibold text-sm text-slate-700">Pasien</div>,
      cell: ({ row }) => {
        const patient = row.original.patient;
        return (
          <div className="space-y-0.5 text-center">
            <div className="font-semibold text-sm text-slate-900 leading-snug">
              {patient?.name || '-'}
            </div>
            <div className="text-xs text-slate-500 font-medium">
              No. RM: <span className="text-slate-700 font-semibold">{patient?.medical_record_number || '-'}</span>
            </div>
          </div>
        );
      },
    }),

    columnHelper.accessor('clinic_department', {
      header: () => <div className="text-center font-semibold text-sm text-slate-700">Poli Tujuan</div>,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700">
          <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
          <span>{row.getValue('clinic_department')}</span>
        </div>
      ),
    }),

    columnHelper.accessor((row) => row.doctor?.name || '', {
      id: 'doctor_name',
      header: () => <div className="text-center font-semibold text-sm text-slate-700">Dokter Pemeriksa</div>,
      cell: ({ row }) => {
        const docName = row.original.doctor?.name;
        return docName ? (
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700">
            <Stethoscope className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{docName}</span>
          </div>
        ) : (
          <div className="text-center text-slate-400 font-medium text-sm">-</div>
        );
      },
    }),

    columnHelper.accessor('visit_date', {
      header: () => <div className="text-center font-semibold text-sm text-slate-700">Tgl Kunjungan</div>,
      cell: ({ row }) => {
        const rawDate = row.getValue('visit_date');
        if (!rawDate) return <div className="text-center text-slate-500 font-medium text-sm">-</div>;
        const d = new Date(rawDate);
        return (
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        );
      },
    }),

    columnHelper.accessor('payment_type', {
      header: () => <div className="text-center font-semibold text-sm text-slate-700">Pembayaran</div>,
      cell: ({ row }) => (
        <div className="text-center font-medium text-sm text-slate-700">
          {row.getValue('payment_type')}
        </div>
      ),
    }),

    columnHelper.accessor((row) => row.queue?.queue_number || row.queue_number || '-', {
      id: 'queue_number',
      header: ({ column }) => (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm font-semibold text-slate-700 hover:text-slate-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            No. Antrean
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-slate-600" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const qNum = row.original.queue?.queue_number || row.original.queue_number;
        return qNum ? (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className="bg-teal-50 text-teal-800 border-teal-200 text-xs font-semibold px-2.5 py-0.5"
            >
              {qNum}
            </Badge>
          </div>
        ) : (
          <div className="text-center text-slate-400 font-medium text-sm">-</div>
        );
      },
    }),

    columnHelper.accessor('status', {
      header: () => <div className="text-center font-semibold text-sm text-slate-700">Status</div>,
      cell: ({ row }) => {
        const status = row.getValue('status');
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={`${getStatusBadgeClass(status)} text-xs font-semibold px-2.5 py-0.5`}
            >
              {status}
            </Badge>
          </div>
        );
      },
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-center font-semibold text-sm text-slate-700">Aksi</div>,
      cell: ({ row }) => {
        const reg = row.original;
        return (
          <div className="flex items-center justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView && onView(reg)}
              className="h-8 px-3 text-sm gap-1.5 font-medium text-slate-700 hover:text-slate-900 border-slate-200 shadow-none"
              title="Lihat Detail Pendaftaran"
            >
              <Eye className="h-4 w-4" />
              <span>Detail</span>
            </Button>
          </div>
        );
      },
    }),
  ]);
};
