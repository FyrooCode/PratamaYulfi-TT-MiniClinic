import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Memuat sesi...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md text-center p-6 bg-white rounded-xl shadow border border-slate-200">
          <h2 className="text-lg font-bold text-red-600 mb-2">Akses Ditolak (403)</h2>
          <p className="text-sm text-slate-600 mb-4">
            Role akun Anda ({user.role}) tidak memiliki izin untuk mengakses halaman ini.
          </p>
          <a
            href={user.role === 'doctor' ? '/examination' : '/dashboard'}
            className="text-sm text-teal-600 font-semibold hover:underline"
          >
            Kembali ke Halaman Utama
          </a>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
