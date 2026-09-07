import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  Activity,
  Database,
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Stethoscope,
  Layers,
  ChevronRight,
  Server
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function HealthStatusCard({ health, loading, error, onRefresh }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">System & Database Status</h2>
            <p className="text-sm text-slate-500">Live health check endpoint via Backend Express & PostgreSQL</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Memeriksa...' : 'Perbarui Status'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-5">
        {/* Backend Status */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
          <Server className="w-5 h-5 text-slate-600 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Backend API</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  health?.data?.server?.status === 'UP' ? 'bg-emerald-500 animate-pulse-dot' : 'bg-rose-500'
                }`}
              />
              <span className="font-semibold text-slate-800 text-sm">
                {health?.data?.server?.status === 'UP' ? 'Online (Port 5000)' : 'Unreachable'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {health?.data?.server?.responseTimeMs !== undefined
                ? `Latency: ${health.data.server.responseTimeMs}ms`
                : 'Cek koneksi backend...'}
            </p>
          </div>
        </div>

        {/* Database Status */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
          <Database className="w-5 h-5 text-slate-600 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">PostgreSQL DB</span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  health?.data?.database?.status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse-dot' : 'bg-rose-500'
                }`}
              />
              <span className="font-semibold text-slate-800 text-sm">
                {health?.data?.database?.status || 'Disconnected'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 truncate">
              DB: {health?.data?.database?.name || 'mini_clinic_db'}
            </p>
          </div>
        </div>

        {/* System Uptime */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
          <Clock className="w-5 h-5 text-slate-600 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Server Uptime</span>
            <div className="mt-1">
              <span className="font-semibold text-slate-800 text-sm">
                {health?.data?.server?.uptimeSeconds !== undefined
                  ? `${health.data.server.uptimeSeconds} detik`
                  : '-'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Node: {health?.data?.server?.nodeVersion || 'v20'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Gagal menghubungi backend di <strong>{API_BASE_URL}/health</strong>. Pastikan container backend aktif.</span>
        </div>
      )}
    </div>
  );
}

function OverviewTab({ health, loading, error, onRefresh }) {
  const records = health?.data?.database?.records || { users: 3, patients: 3, queues: 3 };

  return (
    <div className="space-y-6">
      {/* Live System Health */}
      <HealthStatusCard health={health} loading={loading} error={error} onRefresh={onRefresh} />

      {/* Metrics Cards - 5 Modules Scope */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Antrean</span>
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{records.queues ?? 2}</h3>
            <p className="text-[11px] text-teal-600 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tabel <code>queues</code>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pasien</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{records.patients ?? 3}</h3>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tabel <code>patients</code>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pendaftaran</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{records.registrations ?? 2}</h3>
            <p className="text-[11px] text-amber-600 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tabel <code>registrations</code>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Rekam Medis (SOAP)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{records.medical_records ?? 1}</h3>
            <p className="text-[11px] text-rose-600 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tabel <code>medical_records</code>
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pengguna</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-slate-900">{records.users ?? 3}</h3>
            <p className="text-[11px] text-indigo-600 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Tabel <code>users</code>
            </p>
          </div>
        </div>
      </div>

      {/* Tech Test Quick Guide */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 text-white rounded-2xl p-7 shadow-lg">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold tracking-wide uppercase">
              <Layers className="w-3.5 h-3.5" />
              Technical Test Boilerplate Ready
            </div>
            <h3 className="text-xl font-bold text-white">Mini Clinic Information System Monorepo</h3>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Seluruh service (React Nginx Frontend, Node.js Express Backend, dan PostgreSQL 15) telah terintegrasi via Docker Compose dengan volume database persisten dan migrasi schema otomatis.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-teal-200 border border-white/10">
              Vite + React 18
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-teal-200 border border-white/10">
              Express + pg Pool
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-white/10 text-xs font-medium text-teal-200 border border-white/10">
              PostgreSQL 15 Alpine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueuePlaceholder() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center space-y-4">
      <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto">
        <Clock className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Modul Antrean Pasien</h2>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        Halaman antrean pasien siap dikembangkan. Endpoint backend dapat dihubungkan ke tabel <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-700">queues</code>.
      </p>
      <div className="pt-2">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700">
          Kembali ke Overview <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function PatientsPlaceholder() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center space-y-4">
      <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
        <UserCheck className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Modul Data Pasien</h2>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        Manajemen data pasien (NIK, nama, tanggal lahir, riwayat pendaftaran). Terhubung dengan tabel <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-700">patients</code>.
      </p>
      <div className="pt-2">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700">
          Kembali ke Overview <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function UsersPlaceholder() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8 text-center space-y-4">
      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
        <Users className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900">Modul Pengguna & Petugas Medis</h2>
      <p className="text-slate-500 text-sm max-w-md mx-auto">
        Manajemen autentikasi dan role pengguna (Admin, Dokter, Staff). Terhubung dengan tabel <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-700">users</code>.
      </p>
      <div className="pt-2">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700">
          Kembali ke Overview <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Failed to fetch health status:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { to: '/', label: 'Overview' },
    { to: '/antrean', label: 'Antrean' },
    { to: '/pasien', label: 'Data Pasien' },
    { to: '/pengguna', label: 'Pengguna' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-500/20">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Mini Clinic</h1>
              <p className="text-xs text-slate-500 font-medium">Information System</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route
            path="/"
            element={<OverviewTab health={health} loading={loading} error={error} onRefresh={fetchHealth} />}
          />
          <Route path="/antrean" element={<QueuePlaceholder />} />
          <Route path="/pasien" element={<PatientsPlaceholder />} />
          <Route path="/pengguna" element={<UsersPlaceholder />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>Technical Test &copy; {new Date().getFullYear()} Mini Clinic Information System</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500"></span>
            Docker Compose Monorepo Ready
          </span>
        </div>
      </footer>
    </div>
  );
}
