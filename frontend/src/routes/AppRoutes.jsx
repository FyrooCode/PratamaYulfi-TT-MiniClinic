import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProtectedRoute from '@/routes/ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes inside Dashboard Layout */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'receptionist', 'doctor']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Placeholder for remaining modules */}
          <Route path="/patients" element={<div className="p-4 bg-white rounded-lg border">Modul Pasien (Segera Hadir)</div>} />
          <Route path="/registrations" element={<div className="p-4 bg-white rounded-lg border">Modul Pendaftaran (Segera Hadir)</div>} />
          <Route path="/queues" element={<div className="p-4 bg-white rounded-lg border">Modul Antrean (Segera Hadir)</div>} />
          <Route path="/examination" element={<div className="p-4 bg-white rounded-lg border">Modul Pemeriksaan Dokter (SOAP) (Segera Hadir)</div>} />
        </Route>
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
