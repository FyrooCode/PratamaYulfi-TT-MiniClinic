import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, ClipboardList, CheckCircle2, Clock } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Selamat datang, {user?.name || user?.email}!
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Ringkasan operasional dan modul SIM Klinik hari ini.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Pasien</CardTitle>
            <Users className="w-4 h-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Modul Pasien</div>
            <p className="text-xs text-slate-500 mt-1">Master data & riwayat pasien</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pendaftaran Hari Ini</CardTitle>
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Pendaftaran</div>
            <p className="text-xs text-slate-500 mt-1">Kelola kunjungan poli dokter</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Status Antrean</CardTitle>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">Lobi Monitor</div>
            <p className="text-xs text-slate-500 mt-1">Layar TV Display publik</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pemeriksaan Dokter</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">SOAP & Resep</div>
            <p className="text-xs text-slate-500 mt-1">Pencatatan medis dokter</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
