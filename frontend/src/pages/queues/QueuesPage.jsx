import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotification } from '@/context/NotificationContext';
import { queuesApi } from '@/api/queues.api';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CurrentServingCard } from '@/features/queues/CurrentServingCard';
import { QueueWaitingList } from '@/features/queues/QueueWaitingList';
import { formatQueueNumber } from '@/features/queues/queue-columns';
import {
  Volume2,
  RotateCcw,
  Building2,
  RefreshCw,
  Loader2,
  Layers,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';

const CLINIC_DEPARTMENTS = [
  { value: 'ALL', label: 'Semua Poli' },
  { value: 'Poli Umum', label: 'Poli Umum' },
  { value: 'Poli Gigi', label: 'Poli Gigi' },
  { value: 'Poli Anak', label: 'Poli Anak' },
  { value: 'Poli Penyakit Dalam', label: 'Poli Penyakit Dalam' },
];

export default function QueuesPage() {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Selected Poli Filter
  const [selectedPoli, setSelectedPoli] = useState('ALL');

  // Queue Data
  const [currentServing, setCurrentServing] = useState(null);
  const [waitingQueues, setWaitingQueues] = useState([]);
  const [totalWaiting, setTotalWaiting] = useState(0);
  const [totalServedToday, setTotalServedToday] = useState(0);

  // Loading States
  const [isLoading, setIsLoading] = useState(false);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [isRecalling, setIsRecalling] = useState(false);
  const [callingId, setCallingId] = useState(null);

  // RBAC Permission Check
  const canCallQueue = user?.role === 'admin' || user?.role === 'receptionist';

  // Fetch all queue data (Display + Waiting Queues + Stats)
  const fetchQueueData = useCallback(async () => {
    setIsLoading(true);
    try {
      const deptFilter = selectedPoli !== 'ALL' ? selectedPoli : undefined;

      // 1. Fetch display queues (current calling & upcoming)
      const displayRes = await queuesApi.getDisplay({
        clinic_department: deptFilter,
      });

      if (displayRes.success && displayRes.data) {
        if (displayRes.data.current_calling) {
          setCurrentServing(displayRes.data.current_calling);
        }
      }

      // 2. Fetch full waiting queue list for receptionist
      const waitingRes = await queuesApi.getAll({
        page: 1,
        limit: 50,
        status: 'Menunggu',
        clinic_department: deptFilter,
      });

      if (waitingRes.success && waitingRes.data) {
        setWaitingQueues(waitingRes.data || []);
        setTotalWaiting(waitingRes.pagination?.totalData || waitingRes.data.length);
      }

      // 3. Fetch total served today
      const allTodayRes = await queuesApi.getAll({
        page: 1,
        limit: 100,
        clinic_department: deptFilter,
      });

      if (allTodayRes.success && allTodayRes.data) {
        const allItems = allTodayRes.data || [];
        const servedCount = allItems.filter((q) =>
          ['Check In', 'Pemeriksaan', 'Selesai'].includes(q.status)
        ).length;
        setTotalServedToday(servedCount);

        // If no currentServing set from display yet, find newest active Check In/Pemeriksaan by updated_at
        if (!displayRes.data?.current_calling) {
          const activeItem = [...allItems]
            .filter((q) => ['Check In', 'Pemeriksaan'].includes(q.status))
            .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))[0];
          if (activeItem) {
            setCurrentServing(activeItem);
          } else {
            setCurrentServing(null);
          }
        }
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Gagal Memuat Data Antrean',
        message:
          err.response?.data?.message ||
          'Terjadi kesalahan saat memuat data antrean dari server.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedPoli, showNotification]);

  useEffect(() => {
    fetchQueueData();
  }, [fetchQueueData]);

  // Action 1: Panggil Antrean Berikutnya (POST /api/queues/next)
  const handleCallNext = async () => {
    if (!canCallQueue) return;
    setIsCallingNext(true);

    try {
      const res = await queuesApi.callNext();

      if (res.success && res.data) {
        const item = res.data;
        const formattedNum = formatQueueNumber(item.queue_number);
        setCurrentServing(item);

        showNotification({
          type: 'success',
          title: 'Memanggil Antrean Berikutnya',
          message: `Nomor Antrean ${formattedNum} dipanggil ke ${
            item.registration?.clinic_department || item.clinic_department || 'Poli'
          }.`,
        });

        await fetchQueueData();
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 404) {
        showNotification({
          type: 'info',
          title: 'Antrean Kosong',
          message: 'Tidak ada pasien yang sedang menunggu antrean hari ini.',
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Gagal Memanggil Antrean',
          message:
            err.response?.data?.message ||
            'Tidak dapat memproses panggilan antrean berikutnya.',
        });
      }
    } finally {
      setIsCallingNext(false);
    }
  };

  // Action 2: Panggil Ulang Antrean Aktif (Recall)
  const handleRecallCurrent = async () => {
    if (!canCallQueue || !currentServing?.id) return;
    setIsRecalling(true);

    try {
      const res = await queuesApi.callById(currentServing.id);

      if (res.success) {
        const formattedNum = formatQueueNumber(currentServing.queue_number);
        setCurrentServing((prev) => ({
          ...prev,
          ...(res.data || {}),
          updated_at: new Date().toISOString(),
        }));

        showNotification({
          type: 'success',
          title: 'Panggil Ulang Antrean',
          message: `Memanggil ulang nomor antrean ${formattedNum}.`,
        });

        await fetchQueueData();
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Gagal Memanggil Ulang',
        message:
          err.response?.data?.message ||
          'Terjadi kesalahan saat memanggil ulang antrean.',
      });
    } finally {
      setIsRecalling(false);
    }
  };

  // Action 3: Panggil Antrean Tertentu dari Daftar Menunggu (PUT /api/queues/:id/call)
  const handleCallSpecificQueue = async (queueItem) => {
    if (!canCallQueue || !queueItem?.id) return;
    setCallingId(queueItem.id);

    try {
      const res = await queuesApi.callById(queueItem.id);

      if (res.success) {
        const formattedNum = formatQueueNumber(queueItem.queue_number);
        setCurrentServing({
          ...queueItem,
          ...(res.data || {}),
          updated_at: new Date().toISOString(),
        });

        showNotification({
          type: 'success',
          title: 'Antrean Dipanggil',
          message: `Nomor antrean ${formattedNum} berhasil dipanggil ke loket.`,
        });

        await fetchQueueData();
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Gagal Memanggil Antrean',
        message:
          err.response?.data?.message ||
          'Terjadi kesalahan saat memanggil antrean yang dipilih.',
      });
    } finally {
      setCallingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0 shadow-2xs">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-tight">
              Kontrol Antrean Loket
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Stasiun pemanggil nomor antrean counter dan manajemen antrean menunggu.
            </p>
          </div>
        </div>

        {/* Global Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={fetchQueueData}
          disabled={isLoading}
          className="gap-2 text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 shadow-none self-start sm:self-auto h-9"
        >
          <RefreshCw
            className={`h-4 w-4 text-slate-500 ${isLoading ? 'animate-spin' : ''}`}
          />
          <span>Segarkan Data</span>
        </Button>
      </div>

      {/* Counter Terminal Layout (3-Zone Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Zone 1: Current Serving Card (Left - 5 Cols) */}
        <div className="lg:col-span-5 flex flex-col">
          <CurrentServingCard
            currentQueue={currentServing}
            totalWaiting={totalWaiting}
            totalServedToday={totalServedToday}
            isLoading={isLoading}
          />
        </div>

        {/* Zone 2: Action Controls Column (Middle - 3 Cols) */}
        <div className="lg:col-span-3 flex flex-col">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col h-full">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-900">
                Aksi Loket
              </CardTitle>
              <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            </CardHeader>

            <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-5">
              {/* Filter Poli Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-teal-600" />
                  <span>Filter Poli Tujuan:</span>
                </label>
                <Select
                  value={selectedPoli}
                  onValueChange={(val) => setSelectedPoli(val)}
                >
                  <SelectTrigger className="w-full h-10 bg-white border-slate-200 text-sm font-medium shadow-none">
                    <SelectValue placeholder="Pilih Poli" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200">
                    <SelectGroup>
                      {CLINIC_DEPARTMENTS.map((dept) => (
                        <SelectItem
                          key={dept.value}
                          value={dept.value}
                          className="text-sm cursor-pointer"
                        >
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons Stack */}
              <div className="flex flex-col gap-3 my-auto">
                {/* 1. Next Button (Panggil Berikutnya) */}
                <Button
                  type="button"
                  onClick={handleCallNext}
                  disabled={isCallingNext || !canCallQueue}
                  className="w-full h-14 text-sm sm:text-base font-bold gap-2.5 bg-teal-600 hover:bg-teal-700 text-white shadow-md transition-all active:scale-[0.99] rounded-xl"
                  title={
                    canCallQueue
                      ? 'Panggil antrean pertama yang berstatus Menunggu'
                      : 'Hanya Resepsionis atau Admin yang dapat memanggil antrean'
                  }
                >
                  {isCallingNext ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin text-white" />
                      <span>Memanggil...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-5 w-5 text-teal-100" />
                      <span>Panggil Berikutnya</span>
                    </>
                  )}
                </Button>

                {/* 2. Recall Button (Panggil Ulang yang sedang aktif) */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRecallCurrent}
                  disabled={isRecalling || !currentServing?.id || !canCallQueue}
                  className="w-full h-12 text-sm font-semibold gap-2 border-slate-200 text-slate-700 hover:bg-teal-50 hover:text-teal-900 hover:border-teal-300 shadow-none transition-all rounded-xl disabled:opacity-50"
                  title={
                    !currentServing?.id
                      ? 'Belum ada antrean yang sedang aktif'
                      : 'Panggil ulang nomor antrean yang aktif saat ini'
                  }
                >
                  {isRecalling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                      <span>Memanggil Ulang...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 text-slate-500" />
                      <span>Panggil Ulang (Recall)</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone 3: Upcoming Queue List (Right - 4 Cols) */}
        <div className="lg:col-span-4 flex flex-col">
          <QueueWaitingList
            waitingQueues={waitingQueues}
            onCallQueue={handleCallSpecificQueue}
            callingId={callingId}
            isLoading={isLoading}
            canCallQueue={canCallQueue}
          />
        </div>
      </div>
    </div>
  );
}
