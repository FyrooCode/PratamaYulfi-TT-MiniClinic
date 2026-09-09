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

export function QueueDataTable({
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
                    className="h-12 px-6 text-sm font-semibold text-slate-700 select-none"
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
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2.5 text-slate-500 text-sm">
                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                    <span className="font-medium">Memuat data antrean pasien...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="hover:bg-slate-50/70 border-slate-200 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-6 py-4 text-sm">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-44 text-center text-slate-500 text-sm"
                >
                  <div className="flex flex-col items-center justify-center gap-1.5 py-6">
                    <p className="font-semibold text-slate-700">Tidak ada data antrean</p>
                    <p className="text-xs text-slate-400">
                      Belum ada pasien yang sedang mengantre dengan filter yang dipilih.
                    </p>
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
          {/* Total Information & Page Size Selector */}
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-600">
            <div>
              Total <span className="font-semibold text-slate-900">{pagination.totalData || 0}</span> antrean
              {pagination.totalPages > 0 && (
                <span className="text-slate-400 ml-1">
                  (Halaman {pagination.currentPage} dari {pagination.totalPages})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500">Tampilkan:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(val) => onPageSizeChange && onPageSizeChange(Number(val))}
              >
                <SelectTrigger className="h-8 w-[72px] text-xs bg-white border-slate-200 shadow-none">
                  <SelectValue placeholder={String(pageSize)} />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-200">
                  <SelectGroup>
                    {[5, 10, 20, 50].map((size) => (
                      <SelectItem key={size} value={String(size)} className="text-xs">
                        {size}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pagination Navigation Controls */}
          {pagination.totalPages > 1 && (
            <Pagination className="mx-0 w-auto">
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => {
                      if (pagination.currentPage > 1) {
                        onPageChange(pagination.currentPage - 1);
                      }
                    }}
                    className={`h-8 w-8 p-0 cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 ${
                      pagination.currentPage <= 1 ? 'pointer-events-none opacity-40' : ''
                    }`}
                  />
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    onClick={() => {
                      if (pagination.currentPage < pagination.totalPages) {
                        onPageChange(pagination.currentPage + 1);
                      }
                    }}
                    className={`h-8 w-8 p-0 cursor-pointer border-slate-200 text-slate-700 hover:bg-slate-100 ${
                      pagination.currentPage >= pagination.totalPages ? 'pointer-events-none opacity-40' : ''
                    }`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </div>
  );
}
