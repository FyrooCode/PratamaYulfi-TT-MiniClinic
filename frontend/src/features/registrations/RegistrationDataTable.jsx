import * as React from 'react';
import { useTable } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { features } from '@/features/patients/data-table-features';

export function RegistrationDataTable({
  columns,
  data,
  pagination,
  onPageChange,
  pageSize = 10,
  onPageSizeChange,
  isLoading = false,
}) {
  const [sorting, setSorting] = React.useState([]);

  const table = useTable({
    features,
    data,
    columns,
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="space-y-4">
      {/* Table Container */}
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-none">
        <Table>
          <TableHeader className="bg-slate-50/80">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-slate-200">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 px-4 text-sm font-semibold text-slate-700 select-none text-center"
                  >
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-2.5 text-slate-500 text-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
                    <span className="font-medium">
                      Memuat data pendaftaran kunjungan...
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-slate-100 hover:bg-slate-50/80 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3.5 text-sm text-slate-700 text-center">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40 text-center">
                  <div className="text-sm font-medium text-slate-500">
                    Tidak ada data pendaftaran kunjungan yang ditemukan.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-1">
          {/* Status info with clear standard hierarchy */}
          <div className="text-sm font-medium text-slate-600">
            Menampilkan halaman{' '}
            <span className="font-semibold text-slate-900">{pagination.currentPage || 1}</span> dari{' '}
            <span className="font-semibold text-slate-900">{pagination.totalPages || 1}</span>{' '}
            <span className="text-slate-400 mx-1">•</span>{' '}
            Total <span className="font-semibold text-slate-900">{pagination.totalData || 0}</span> data pendaftaran
          </div>

          <div className="flex items-center gap-4">
            {/* Rows Per Page Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 whitespace-nowrap">
                Baris per halaman:
              </span>
              <Select
                value={String(pageSize || 10)}
                onValueChange={(val) => onPageSizeChange && onPageSizeChange(Number(val))}
              >
                <SelectTrigger className="h-8 w-[76px] text-sm font-medium border-slate-200 shadow-none bg-white">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent align="end">
                  <SelectGroup>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Shadcn Icons-Only Pagination */}
            <Pagination className="mx-0 w-auto">
              <PaginationContent className="gap-1.5">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => {
                      if (pagination.currentPage > 1) {
                        onPageChange(pagination.currentPage - 1);
                      }
                    }}
                    disabled={pagination.currentPage <= 1 || isLoading}
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    onClick={() => {
                      if (pagination.currentPage < pagination.totalPages) {
                        onPageChange(pagination.currentPage + 1);
                      }
                    }}
                    disabled={pagination.currentPage >= pagination.totalPages || isLoading}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}
