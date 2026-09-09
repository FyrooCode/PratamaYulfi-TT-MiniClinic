import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/pages/auth/LoginPage';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProtectedRoute from '@/routes/ProtectedRoute';

import PatientsPage from '@/pages/patients/PatientsPage';
import CreatePatientPage from '@/pages/patients/CreatePatientPage';
import EditPatientPage from '@/pages/patients/EditPatientPage';
import RegistrationsPage from '@/pages/registrations/RegistrationsPage';
import CreateRegistrationPage from '@/pages/registrations/CreateRegistrationPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Routes inside Dashboard Layout */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'receptionist', 'doctor']} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* Patients Module */}
          <Route path="/patients" element={<PatientsPage />} />
          <Route path="/patients/new" element={<CreatePatientPage />} />
          <Route path="/patients/:id/edit" element={<EditPatientPage />} />
          {/* Registrations Module */}
          <Route path="/registrations" element={<RegistrationsPage />} />
          <Route path="/registrations/new" element={<CreateRegistrationPage />} />
          <Route path="/queues" element={<div className="p-4 bg-white rounded-lg border">Modul Antrean (Segera Hadir)</div>} />
          <Route path="/examination" element={<div className="p-4 bg-white rounded-lg border">Modul Pemeriksaan Dokter (SOAP) (Segera Hadir)</div>} />
        </Route>
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
