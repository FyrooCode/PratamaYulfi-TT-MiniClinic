import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Stethoscope, ArrowUpRight } from 'lucide-react';

export function LoginForm({ className, ...props }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ email, password });
      showNotification({
        type: 'success',
        title: 'Login Berhasil',
        message: `Selamat datang, ${user.name || user.email}! Sesi Anda telah aktif.`,
      });

      if (user.role === 'doctor') {
        navigate('/examination');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('flex flex-col gap-6', className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-white shadow-md shadow-teal-500/20">
          <Stethoscope className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Masuk ke Sistem</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Masukkan email dan password akun klinik Anda
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
          </div>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium h-10 mt-2"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memverifikasi...
            </>
          ) : (
            'Masuk'
          )}
        </Button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3.5 text-xs text-slate-500 space-y-2.5">
        <p className="font-semibold text-slate-700">Akses Demo Akun:</p>
        <div className="space-y-2 text-xs">
          {/* Admin */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex flex-col">
              <span className="text-teal-700 font-bold">Admin</span>
              <div className="text-slate-600">
                <span>admin@clinic.com</span>
                <span className="mx-1 text-slate-300">•</span>
                <span className="text-slate-400">password123</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleFillDemo('admin@clinic.com', 'password123')}
              title="Gunakan akun Admin"
              className="h-7 w-7 rounded border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 flex items-center justify-center text-slate-500 transition-colors shadow-none shrink-0 cursor-pointer"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Dokter */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <div className="flex flex-col">
              <span className="text-teal-700 font-bold">Dokter</span>
              <div className="text-slate-600">
                <span>dr.budi@clinic.com</span>
                <span className="mx-1 text-slate-300">•</span>
                <span className="text-slate-400">password123</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleFillDemo('dr.budi@clinic.com', 'password123')}
              title="Gunakan akun Dokter"
              className="h-7 w-7 rounded border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 flex items-center justify-center text-slate-500 transition-colors shadow-none shrink-0 cursor-pointer"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Resepsionis */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-teal-700 font-bold">Resepsionis</span>
              <div className="text-slate-600">
                <span>resepsionis@clinic.com</span>
                <span className="mx-1 text-slate-300">•</span>
                <span className="text-slate-400">password123</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleFillDemo('resepsionis@clinic.com', 'password123')}
              title="Gunakan akun Resepsionis"
              className="h-7 w-7 rounded border border-slate-200 bg-white hover:bg-teal-50 hover:border-teal-300 hover:text-teal-700 flex items-center justify-center text-slate-500 transition-colors shadow-none shrink-0 cursor-pointer"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
