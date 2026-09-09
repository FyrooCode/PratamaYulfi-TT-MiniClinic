import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/context/NotificationContext';
import { patientsApi } from '@/api/patients.api';
import { createPatientColumns } from '@/features/patients/patient-columns';
import { PatientDataTable } from '@/features/patients/PatientDataTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  Users,
  RefreshCw,
  Plus,
  User,
  Calendar,
  Phone,
  MapPin,
  FileText,
  Clock,
  Trash2,
  Loader2,
} from 'lucide-react';

export default function PatientsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State (Read-only quick view)
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Delete Confirmation Dialog State
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const calculateAge = (dobString) => {
    if (!dobString) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? `${age} tahun` : null;
  };

  const fetchPatients = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await patientsApi.getAll({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
      });

      if (res.success && res.data) {
        setPatients(res.data);
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
  }, [currentPage, pageSize, debouncedSearch, showNotification]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setIsDetailOpen(true);
  };

  const handleEditPatient = (patient) => {
    navigate(`/patients/${patient.id}/edit`);
  };

  const handleDeletePatient = (patient) => {
    setPatientToDelete(patient);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);

    try {
      await patientsApi.delete(patientToDelete.id);
      showNotification({
        type: 'success',
        title: 'Berhasil Dihapus',
        message: `Data pasien "${patientToDelete.name}" berhasil dihapus.`,
      });
      setIsDeleteDialogOpen(false);
      setPatientToDelete(null);
      fetchPatients();
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Gagal Menghapus',
        message: err.response?.data?.message || 'Pasien ini mungkin memiliki riwayat pendaftaran/pemeriksaan.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const canMutate = user?.role === 'admin' || user?.role === 'receptionist';

  const columns = React.useMemo(() => {
    return createPatientColumns({
      onView: handleViewPatient,
      onEdit: handleEditPatient,
      onDelete: handleDeletePatient,
      canEdit: canMutate,
      canDelete: canMutate,
    });
  }, [canMutate]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Users className="h-7 w-7 text-teal-600" />
            <span>Master Data Pasien</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-[65ch]">
            Kelola dan cari data induk rekam medis pasien klinik.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchPatients}
            disabled={isLoading}
            className="h-9 gap-1.5 border-slate-200 shadow-none text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Segarkan</span>
          </Button>

          {canMutate && (
            <Button
              size="sm"
              onClick={() => navigate('/patients/new')}
              className="h-9 gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Pasien Baru</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3.5 rounded-lg border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari nama pasien, NIK, atau No. RM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 text-sm border-slate-200 shadow-none"
          />
        </div>

        {debouncedSearch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchTerm('')}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 h-9"
          >
            Reset
          </Button>
        )}
      </div>

      {/* TanStack Data Table */}
      <PatientDataTable
        columns={columns}
        data={patients}
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
              <User className="h-6 w-6 text-teal-600" />
            </AlertDialogMedia>
            <div className="flex items-center justify-between w-full">
              <AlertDialogTitle className="text-lg font-bold text-slate-900">
                Detail Rekam Medis Pasien
              </AlertDialogTitle>
              {selectedPatient && (
                <span className="text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-1 rounded">
                  {selectedPatient.medical_record_number}
                </span>
              )}
            </div>
            <AlertDialogDescription className="text-sm text-slate-600 leading-relaxed pt-1">
              Informasi lengkap data identitas induk pasien yang tercatat di klinik.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Patient Details Summary Card */}
          {selectedPatient && (
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-sm space-y-2.5">
              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Nama Pasien</span>
                <span className="font-semibold text-slate-900">{selectedPatient.name}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">NIK (16 Digit)</span>
                <span className="font-semibold text-slate-800">{selectedPatient.nik}</span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Jenis Kelamin</span>
                <span className="font-medium text-slate-800">
                  {selectedPatient.gender === 'L' || selectedPatient.gender === 'Male'
                    ? 'Laki-laki (L)'
                    : 'Perempuan (P)'}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">Tanggal Lahir</span>
                <span className="font-medium text-slate-800">
                  {new Date(selectedPatient.dob).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  {calculateAge(selectedPatient.dob) ? ` (${calculateAge(selectedPatient.dob)})` : ''}
                </span>
              </div>

              <div className="flex justify-between items-center py-0.5">
                <span className="text-slate-500">No. Telepon</span>
                <span className="font-medium text-slate-800">{selectedPatient.phone || '-'}</span>
              </div>

              <div className="flex justify-between items-start py-0.5">
                <span className="text-slate-500 shrink-0">Alamat Domisili</span>
                <span className="font-medium text-slate-800 text-right leading-relaxed max-w-[220px]">
                  {selectedPatient.address || '-'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200/80">
                <span className="text-slate-500">Terdaftar Pada</span>
                <span className="text-xs text-slate-600 font-medium">
                  {new Date(selectedPatient.created_at).toLocaleDateString('id-ID', {
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

      {/* Destructive Alert Dialog for Deleting Patient */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md bg-white rounded-xl shadow-xl border border-slate-200">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5 text-red-600 mb-1">
              <div className="h-9 w-9 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                <Trash2 className="h-4 w-4 text-red-600" />
              </div>
              <AlertDialogTitle className="text-lg font-bold text-slate-900">
                Hapus Data Rekam Medis Pasien?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-slate-600 leading-relaxed pt-1">
              Apakah Anda yakin ingin menghapus data pasien{' '}
              <strong className="text-slate-900 font-semibold">{patientToDelete?.name}</strong>{' '}
              ({patientToDelete?.medical_record_number})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 gap-2 sm:gap-2">
            <AlertDialogCancel
              disabled={isDeleting}
              className="text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={confirmDeletePatient}
              disabled={isDeleting}
              className="text-sm font-medium gap-1.5 bg-red-600 hover:bg-red-700 text-white shadow-sm"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  <span>Ya, Hapus Pasien</span>
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
