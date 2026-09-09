import * as React from 'react';
import { createColumnHelper } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Pencil, Trash2, Calendar, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const columnHelper = createColumnHelper();

export const createPatientColumns = ({ onView, onEdit, onDelete, canEdit = false, canDelete = false }) => {
  return columnHelper.columns([
    columnHelper.accessor('medical_record_number', {
      header: ({ column }) => (
        <div className="flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm font-semibold text-slate-700 hover:text-slate-900"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            No. RM
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-slate-600" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="text-center font-medium text-sm text-slate-700">
          {row.getValue('medical_record_number')}
        </div>
      ),
    }),

    columnHelper.accessor('nik', {
      header: () => <div className="text-center font-semibold text-sm text-slate-700">NIK</div>,
      cell: ({ row }) => (
        <div className="text-center font-medium text-sm text-slate-600 tracking-wide">
          {row.getValue('nik')}
        </div>
      ),
    }),

    columnHelper.accessor('name', {
      header: ({ column }) => (
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-sm font-semibold text-slate-700 hover:text-slate-900 -ml-2"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nama Pasien
            <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 text-slate-600" />
          </Button>
        </div>
      ),
      cell: ({ row }) => (
        <div className="font-semibold text-sm text-slate-900 leading-snug">
          {row.getValue('name')}
        </div>
      ),
    }),

    columnHelper.accessor('gender', {
      header: () => <div className="text-center font-semibold text-sm text-slate-700">L/P</div>,
      cell: ({ row }) => {
        const gender = row.getValue('gender');
        const isMale = gender === 'L' || gender === 'Male';
        return (
          <div className="flex justify-center">
            <Badge
              variant="outline"
              className={
                isMale
                  ? 'bg-blue-50 text-blue-700 border-blue-200 text-xs font-semibold px-2 py-0.5'
                  : 'bg-pink-50 text-pink-700 border-pink-200 text-xs font-semibold px-2 py-0.5'
              }
            >
              {isMale ? 'L' : 'P'}
            </Badge>
          </div>
        );
      },
    }),

    columnHelper.accessor('dob', {
      header: () => <div className="text-center font-semibold text-sm text-slate-700">Tgl Lahir</div>,
      cell: ({ row }) => {
        const rawDate = row.getValue('dob');
        if (!rawDate) return <div className="text-center text-slate-500 font-medium text-sm">-</div>;
        const d = new Date(rawDate);
        return (
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700">
            <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
            <span>{d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        );
      },
    }),

    columnHelper.accessor('phone', {
      header: () => <div className="text-center font-semibold text-sm text-slate-700">No. Telepon</div>,
      cell: ({ row }) => {
        const phone = row.getValue('phone');
        return phone ? (
          <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-slate-700">
            <Phone className="h-4 w-4 text-slate-500 shrink-0" />
            <span>{phone}</span>
          </div>
        ) : (
          <div className="text-center text-slate-500 font-medium text-sm">-</div>
        );
      },
    }),

    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-center font-semibold text-sm text-slate-700">Aksi</div>,
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView && onView(patient)}
              className="h-8 px-3 text-sm gap-1.5 font-medium text-slate-700 hover:text-slate-900 border-slate-200 shadow-none"
              title="Lihat Detail Pasien"
            >
              <Eye className="h-4 w-4" />
              <span>Detail</span>
            </Button>

            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit && onEdit(patient)}
                className="h-8 px-2.5 text-sm font-medium text-teal-700 hover:text-teal-800 hover:bg-teal-50 border-teal-200 shadow-none"
                title="Edit Data Pasien"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}

            {canDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete && onDelete(patient)}
                className="h-8 px-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 shadow-none"
                title="Hapus Data Pasien"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    }),
  ]);
};
