import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/context/NotificationContext';
import { registrationsApi } from '@/api/registrations.api';
import {
  createRegistrationColumns,
  getStatusBadgeClass,
} from '@/features/registrations/registration-columns';
import { RegistrationDataTable } from '@/features/registrations/RegistrationDataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Search,
  ClipboardList,
  RefreshCw,
  Plus,
  XCircle,
  Loader2,
  Calendar,
  Building2,
  Stethoscope,
} from 'lucide-react';

export default function RegistrationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [registrations, setRegistrations] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Menunggu');
  const [isLoading, setIsLoading] = useState(false);

  // Quick Detail Dialog State
  const [selectedReg, setSelectedReg] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Cancel Confirmation Dialog State
  const [regToCancel, setRegToCancel] = useState(null);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchRegistrations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await registrationsApi.getAll({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        status: statusFilter === 'ALL' ? '' : statusFilter,
      });

      if (res.success && res.data) {
        setRegistrations(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Gagal Memuat Data',
        message: err.response?.data?.message || 'Tidak dapat terhubung ke server.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, statusFilter, showNotification]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleViewRegistration = (reg) => {
    setSelectedReg(reg);
    setIsDetailOpen(true);
  };

  const handleCancelPrompt = (reg) => {
    setRegToCancel(reg);
    setIsCancelDialogOpen(true);
  };

  const confirmCancelRegistration = async () => {
    if (!regToCancel) return;
    setIsCancelling(true);

    try {
      await registrationsApi.cancel(regToCancel.id);
      showNotification({
        type: 'success',
        title: 'Pendaftaran Dibatalkan',
        message: `Pendaftaran ${regToCancel.registration_number} (${regToCancel.patient?.name}) berhasil dibatalkan.`,
      });
      setIsCancelDialogOpen(false);
      setRegToCancel(null);
      fetchRegistrations();
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Gagal Membatalkan',
        message: err.response?.data?.message || 'Gagal membatalkan pendaftaran pasien.',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const canMutate = user?.role === 'admin' || user?.role === 'receptionist';

  const columns = React.useMemo(() => {
    return createRegistrationColumns({
      onView: handleViewRegistration,
      onCancel: handleCancelPrompt,
      canMutate,
    });
  }, [canMutate]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <ClipboardList className="h-7 w-7 text-teal-600" />
            <span>Pendaftaran Pasien Berobat</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-[65ch]">
            Kelola data kunjungan pasien, antrean poli, dan dokter pemeriksa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRegistrations}
            disabled={isLoading}
            className="h-9 gap-1.5 border-slate-200 shadow-none text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>

          {canMutate && (
            <Button
              size="sm"
              onClick={() => navigate('/registrations/new')}
              className="h-9 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Daftar Kunjungan Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar & Clickable Status Pills */}
      <div className="space-y-3.5 bg-white p-3.5 rounded-lg border border-slate-200">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama pasien, No. RM, NIK, atau No. Registrasi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 text-sm border-slate-200 shadow-none"
            />
          </div>

          {(debouncedSearch || statusFilter !== 'Menunggu') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('Menunggu');
                setCurrentPage(1);
              }}
              className="text-sm font-medium text-slate-500 hover:text-slate-800 h-9 self-start sm:self-auto"
            >
              Reset Filter
            </Button>
          )}
        </div>

        {/* Clickable Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 shrink-0">
            Status:
          </span>
          {[
            { id: 'ALL', label: 'Semua', activeClass: 'bg-teal-50 text-teal-800 border-teal-300 font-semibold shadow-xs' },
            { id: 'Menunggu', label: 'Menunggu', activeClass: 'bg-amber-50 text-amber-800 border-amber-300 font-semibold shadow-xs' },
            { id: 'Check In', label: 'Check In', activeClass: 'bg-blue-50 text-blue-800 border-blue-300 font-semibold shadow-xs' },
            { id: 'Pemeriksaan', label: 'Pemeriksaan', activeClass: 'bg-purple-50 text-purple-800 border-purple-300 font-semibold shadow-xs' },
            { id: 'Selesai', label: 'Selesai', activeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold shadow-xs' },
          ].map((item) => {
            const isActive = statusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setStatusFilter(item.id);
                  setCurrentPage(1);
                }}
                className={`h-8 px-3 text-xs sm:text-sm rounded-md transition-all whitespace-nowrap cursor-pointer border ${
                  isActive
                    ? item.activeClass
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-200/80 font-medium'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TanStack Data Table */}
      <RegistrationDataTable
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

      {/* Quick Detail Alert Dialog Modal */}
      <AlertDialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <AlertDialogContent className="max-w-md bg-white rounded-xl shadow-xl border border-slate-200">
          <AlertDialogHeader className="items-center text-center sm:items-start sm:text-left">
            <AlertDialogMedia className="mb-2">
              <ClipboardList className="h-6 w-6 text-teal-600" />
            </AlertDialogMedia>
            <div className="flex items-center justify-between w-full">
              <AlertDialogTitle className="text-lg font-bold text-slate-900">
                Detail Pendaftaran Pasien
              </AlertDialogTitle>
              {selectedReg && (
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                  {selectedReg.registration_number}
                </span>
              )}
            </div>
            <AlertDialogDescription className="text-sm text-slate-600 leading-relaxed pt-1">
              Informasi lengkap data registrasi kunjungan berobat dan poli tujuan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Registration Details Summary Card */}
          {selectedReg && (
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-sm space-y-2.5">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Status Kunjungan</span>
                <Badge
                  variant="outline"
                  className={`${getStatusBadgeClass(selectedReg.status)} text-xs font-semibold px-2.5 py-0.5`}
                >
                  {selectedReg.status}
                </Badge>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">No. Antrean Poli</span>
                <span className="font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded text-xs">
                  {selectedReg.queue?.queue_number || selectedReg.queue_number || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Nama Pasien</span>
                <span className="font-semibold text-slate-900">{selectedReg.patient?.name}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">No. Rekam Medis</span>
                <span className="font-semibold text-slate-800">
                  {selectedReg.patient?.medical_record_number}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">NIK (16 Digit)</span>
                <span className="font-medium text-slate-800">{selectedReg.patient?.nik}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Poli Tujuan</span>
                <span className="font-semibold text-slate-900">{selectedReg.clinic_department}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Dokter Pemeriksa</span>
                <span className="font-medium text-slate-800">
                  {selectedReg.doctor?.name || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Tanggal Kunjungan</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedReg.visit_date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Jenis Pembayaran</span>
                <span className="font-medium text-slate-800">{selectedReg.payment_type}</span>
              </div>

              <div className="flex justify-between items-start py-0.5">
                <span className="text-slate-500 shrink-0">Keluhan Awal</span>
                <span className="font-medium text-slate-800 text-right leading-relaxed max-w-[220px]">
                  {selectedReg.initial_complaint || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                <span className="text-slate-500">Waktu Terdaftar</span>
                <span className="text-xs text-slate-600 font-medium">
                  {new Date(selectedReg.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })} WIB
                </span>
              </div>
            </div>
          )}

          <AlertDialogFooter className="pt-2 gap-2 sm:gap-2">
            <AlertDialogCancel
              onClick={() => setIsDetailOpen(false)}
              className="text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none px-5"
            >
              Tutup
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Destructive Alert Dialog for Cancelling Registration */}
      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent className="max-w-md bg-white rounded-xl shadow-xl border border-slate-200">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-rose-600 mb-1">
              <div className="h-9 w-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-rose-600" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-slate-900">
                Batalkan Pendaftaran Kunjungan?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-slate-600 leading-relaxed pt-1">
              Apakah Anda yakin ingin membatalkan pendaftaran{' '}
              <strong className="text-slate-900 font-semibold">{regToCancel?.registration_number}</strong> untuk pasien{' '}
              <strong className="text-slate-900 font-semibold">{regToCancel?.patient?.name}</strong>? Status kunjungan dan antrean pasien akan diubah menjadi <strong className="text-rose-600 font-semibold">Batal</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={isCancelling}
              className="text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none"
            >
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmCancelRegistration}
              disabled={isCancelling}
              className="text-sm font-medium gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Membatalkan...</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  <span>Ya, Batalkan Pendaftaran</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
