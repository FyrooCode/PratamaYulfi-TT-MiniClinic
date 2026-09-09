import * as React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import {
  ArrowUpDown,
  Volume2,
  Building2,
  Stethoscope,
  ChevronDown,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const columnHelper = createColumnHelper();

export const formatQueueNumber = (num) => {
  if (!num) return '-';
  const clean = String(num).trim();
  if (/^[A-Za-z]\d{3}$/.test(clean)) {
    return `${clean[0].toUpperCase()}-${clean.slice(1)}`;
  }
  return clean;
};

export const getStatusBadgeClass = (status) => {
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

export const QUEUE_STATUSES = ['Menunggu', 'Check In', 'Pemeriksaan', 'Selesai'];

export const createQueueColumns = ({
  onCall,
  onUpdateStatus,
  callingId = null,
  updatingId = null,
}) => {
  return columnHelper.columns([
    // 1. Nomor Antrean (Rata Kiri, font mono tebal)
    columnHelper.accessor('queue_number', {
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm font-semibold text-slate-700 hover:text-slate-900 -ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            No. Antrean
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-slate-500" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const raw = row.getValue('queue_number');
        const formatted = formatQueueNumber(raw);
        return (
          <div className="text-left">
            <Badge
              variant="outline"
              className="bg-teal-50 text-teal-800 border-teal-300 px-2.5 py-1 font-mono text-sm font-bold tracking-wide shadow-none"
            >
              {formatted}
            </Badge>
          </div>
        );
      },
    }),

    // 2. Nama Pasien (Kolom Terpisah)
    columnHelper.accessor((row) => row.patient?.name || '', {
      id: 'patient_name',
      header: () => (
        <div className="text-left font-semibold text-sm text-slate-700">
          Nama Pasien
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-semibold text-sm text-slate-900 text-left">
          {row.original.patient?.name || '-'}
        </div>
      ),
    }),

    // 3. No. Rekam Medis (Kolom Terpisah)
    columnHelper.accessor((row) => row.patient?.medical_record_number || '', {
      id: 'medical_record_number',
      header: () => (
        <div className="text-left font-semibold text-sm text-slate-700">
          No. Rekam Medis
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-left font-mono font-medium text-sm text-slate-700">
          {row.original.patient?.medical_record_number || '-'}
        </div>
      ),
    }),

    // 4. Poli Tujuan (Kolom Terpisah, icon netral tanpa warna)
    columnHelper.accessor((row) => row.registration?.clinic_department || '', {
      id: 'clinic_department',
      header: () => (
        <div className="text-left font-semibold text-sm text-slate-700">
          Poli Tujuan
        </div>
      ),
      cell: ({ row }) => {
        const dept = row.original.registration?.clinic_department;
        return (
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 text-left">
            <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{dept || '-'}</span>
          </div>
        );
      },
    }),

    // 5. Dokter Pemeriksa (Kolom Terpisah, icon netral tanpa warna)
    columnHelper.accessor((row) => row.doctor?.name || '', {
      id: 'doctor_name',
      header: () => (
        <div className="text-left font-semibold text-sm text-slate-700">
          Dokter Pemeriksa
        </div>
      ),
      cell: ({ row }) => {
        const docName = row.original.doctor?.name;
        return docName ? (
          <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 text-left">
            <Stethoscope className="h-4 w-4 text-slate-400 shrink-0" />
            <span>{docName}</span>
          </div>
        ) : (
          <div className="text-slate-400 font-medium text-sm text-left">-</div>
        );
      },
    }),

    // 6. Status Antrean (Rata Tengah)
    columnHelper.accessor('status', {
      header: () => (
        <div className="text-center font-semibold text-sm text-slate-700">
          Status
        </div>
      ),
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

    // 7. Kolom Aksi (Tombol Panggil berwarna teal accent)
    columnHelper.display({
      id: 'actions',
      header: () => (
        <div className="text-center font-semibold text-sm text-slate-700">
          Aksi
        </div>
      ),
      cell: ({ row }) => {
        const item = row.original;
        const isCalling = callingId === item.id;
        const isUpdating = updatingId === item.id;
        const isFinished = item.status === 'Selesai';

        return (
          <div className="flex items-center justify-center gap-2">
            {/* Tombol Panggil / Panggil Ulang */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCall && onCall(item)}
              disabled={isCalling || isUpdating || isFinished}
              className="h-8 px-3 text-xs sm:text-sm gap-1.5 font-semibold border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 hover:text-teal-900 shadow-none disabled:opacity-50"
              title={
                isFinished
                  ? 'Pasien sudah selesai periksa'
                  : 'Panggil antrean pasien ini'
              }
            >
              {isCalling ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-teal-600" />
              )}
              <span>{item.status === 'Menunggu' ? 'Panggil' : 'Panggil Ulang'}</span>
            </Button>

            {/* Dropdown Ganti Status Antrean */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isCalling || isUpdating}
                  className="h-8 px-2.5 text-xs sm:text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-100 shadow-none gap-1"
                  title="Ubah Status Antrean"
                >
                  {isUpdating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-500" />
                  ) : (
                    <>
                      <span>Status</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44 bg-white border border-slate-200 shadow-md">
                <DropdownMenuLabel className="text-xs font-semibold text-slate-500">
                  Ubah Status ke:
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100" />
                {QUEUE_STATUSES.map((st) => {
                  const isCurrent = item.status === st;
                  return (
                    <DropdownMenuItem
                      key={st}
                      disabled={isCurrent}
                      onClick={() => onUpdateStatus && onUpdateStatus(item, st)}
                      className="text-xs flex items-center justify-between cursor-pointer py-1.5 focus:bg-slate-50 focus:text-slate-900"
                    >
                      <span className={isCurrent ? 'font-semibold text-slate-900' : 'text-slate-700'}>
                        {st}
                      </span>
                      {isCurrent && <Check className="h-3.5 w-3.5 text-slate-600" />}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ]);
};
