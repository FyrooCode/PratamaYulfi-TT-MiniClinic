import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/context/NotificationContext';
import { dashboardApi } from '@/api/dashboard.api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserCheck,
  ClipboardList,
  Clock,
  CheckCircle2,
  RefreshCw,
  Calendar,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Activity,
  Stethoscope,
  Building2,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const [stats, setStats] = useState({
    total_patients: 0,
    total_patients_today: 0,
    total_queues_today: 0,
    total_waiting: 0,
    total_completed: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch Dashboard Statistics
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getStats();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        throw new Error(res.message || 'Gagal memuat statistik dashboard');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || err.message || 'Terjadi kesalahan saat memuat data.';
      setError(errorMsg);
      showNotification({
        type: 'error',
        title: 'Gagal Memuat Statistik',
        message: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Current Date Formatter in Indonesian
  const formattedToday = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrator',
          className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'doctor':
        return {
          label: 'Dokter Pemeriksa',
          className: 'bg-teal-50 text-teal-700 border-teal-200',
        };
      case 'receptionist':
        return {
          label: 'Resepsionis',
          className: 'bg-blue-50 text-blue-700 border-blue-200',
        };
      default:
        return {
          label: role || 'Pengguna',
          className: 'bg-slate-50 text-slate-700 border-slate-200',
        };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  // 5 Operational Metric Cards Definitions
  const metricCards = [
    {
      id: 'total_patients',
      title: 'Total Pasien',
      value: stats.total_patients,
      description: 'Seluruh pasien terdaftar di rekam medis',
      icon: Users,
      iconColor: 'text-teal-700',
      iconBg: 'bg-teal-50 border-teal-200',
      valueColor: 'text-slate-900',
    },
    {
      id: 'total_patients_today',
      title: 'Total Pasien Hari Ini',
      value: stats.total_patients_today,
      description: 'Pasien unik terdaftar berkunjung hari ini',
      icon: UserCheck,
      iconColor: 'text-blue-700',
      iconBg: 'bg-blue-50 border-blue-200',
      valueColor: 'text-slate-900',
    },
    {
      id: 'total_queues_today',
      title: 'Total Antrean Hari Ini',
      value: stats.total_queues_today,
      description: 'Tiket antrean loket poliklinik diterbitkan',
      icon: ClipboardList,
      iconColor: 'text-indigo-700',
      iconBg: 'bg-indigo-50 border-indigo-200',
      valueColor: 'text-slate-900',
    },
    {
      id: 'total_waiting',
      title: 'Total Pasien Menunggu',
      value: stats.total_waiting,
      description: 'Pasien dalam antrean menunggu giliran',
      icon: Clock,
      iconColor: 'text-amber-700',
      iconBg: 'bg-amber-50 border-amber-200',
      valueColor: 'text-amber-800',
    },
    {
      id: 'total_completed',
      title: 'Total Pasien Selesai Dilayani',
      value: stats.total_completed,
      description: 'Pemeriksaan SOAP dan tindakan tuntas',
      icon: CheckCircle2,
      iconColor: 'text-emerald-700',
      iconBg: 'bg-emerald-50 border-emerald-200',
      valueColor: 'text-emerald-800',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome & Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Selamat datang, {user?.name || user?.email}!
            </h1>
            <Badge
              variant="outline"
              className={`text-xs font-semibold px-2.5 py-0.5 border ${roleInfo.className}`}
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              {roleInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>{formattedToday}</span>
            <span className="text-slate-300">•</span>
            <Activity className="h-3.5 w-3.5 text-teal-600" />
            <span>Status Layanan Aktif</span>
          </div>
        </div>

        {/* Global Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchStats}
          disabled={isLoading}
          className="gap-2 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none self-start md:self-auto h-9"
        >
          <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </Button>
      </div>

      {/* Error Alert (if fetch failed) */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">Gagal memuat metrik: </span>
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchStats}
            className="border-red-300 text-red-700 hover:bg-red-100 h-8"
          >
            Coba Lagi
          </Button>
        </div>
      )}

      {/* 5 Core Metric Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3.5 px-1">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-4 w-4 text-teal-600" />
            <span>Statistik Operasional Klinik</span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">Diperbarui secara real-time</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {metricCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.id}
                className="border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all overflow-hidden relative"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 leading-tight">
                      {card.title}
                    </span>
                    <div
                      className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs ${card.iconBg}`}
                    >
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    {isLoading ? (
                      <div className="h-9 w-20 bg-slate-100 animate-pulse rounded-md my-1" />
                    ) : (
                      <div className={`text-3xl sm:text-4xl font-black tracking-tight ${card.valueColor}`}>
                        {card.value.toLocaleString('id-ID')}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 line-clamp-1">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Navigation / Module Shortcuts Section */}
      <div className="space-y-3.5 pt-2">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 px-1">
          <Building2 className="h-4 w-4 text-teal-600" />
          <span>Akses Cepat Modul Pelayanan</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Modul Pasien (Admin & Receptionist) */}
          {(user?.role === 'admin' || user?.role === 'receptionist') && (
            <div
              onClick={() => navigate('/patients')}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    Data Pasien
                  </h3>
                  <p className="text-xs text-slate-500">Pencarian rekam medis & data induk</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}

          {/* Modul Pendaftaran (Admin & Receptionist) */}
          {(user?.role === 'admin' || user?.role === 'receptionist') && (
            <div
              onClick={() => navigate('/registrations')}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Pendaftaran Kunjungan
                  </h3>
                  <p className="text-xs text-slate-500">Registrasi poli dokter & tiket loket</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}

          {/* Modul Kelola Antrean (Admin & Receptionist) */}
          {(user?.role === 'admin' || user?.role === 'receptionist') && (
            <div
              onClick={() => navigate('/queues')}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                    Kelola Antrean
                  </h3>
                  <p className="text-xs text-slate-500">Pemanggilan nomor antrean & status</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}

          {/* Modul Pemeriksaan Dokter SOAP (Doctor & Admin) */}
          {(user?.role === 'doctor' || user?.role === 'admin') && (
            <div
              onClick={() => navigate('/examination')}
              className="p-4 bg-white border border-slate-200 rounded-xl hover:border-teal-300 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                    Pemeriksaan Dokter (SOAP)
                  </h3>
                  <p className="text-xs text-slate-500">Diagnosis klinis & resep obat pasien</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
