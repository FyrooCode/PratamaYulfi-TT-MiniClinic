import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Volume2,
  Building2,
  Clock,
  Inbox,
  Loader2,
  Users,
} from 'lucide-react';
import { formatQueueNumber } from './queue-columns';

export function QueueWaitingList({
  waitingQueues = [],
  onCallQueue,
  callingId = null,
  isLoading = false,
  canCallQueue = true,
}) {
  const formatTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '-';
    }
  };

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col h-full">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-teal-600" />
          <CardTitle className="text-lg font-bold text-slate-900">
            Antrean Menunggu
          </CardTitle>
        </div>

        <Badge
          variant="secondary"
          className="bg-teal-50 text-teal-800 border border-teal-200 font-bold px-2.5 py-0.5 text-xs"
        >
          {waitingQueues.length} Menunggu
        </Badge>
      </CardHeader>

      <CardContent className="p-4 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <p className="text-sm font-medium">Memuat antrean...</p>
          </div>
        ) : waitingQueues.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center text-slate-400 gap-2">
            <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400">
              <Inbox className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-slate-600">
              Tidak ada antrean menunggu
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              Semua pasien pada poli terpilih telah selesai atau belum ada pendaftaran baru hari ini.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[520px] pr-1">
            {waitingQueues.map((item, idx) => {
              const formattedNum = formatQueueNumber(item.queue_number);
              const dept =
                item.registration?.clinic_department ||
                item.clinic_department ||
                'Poli';
              const isCallingThis = callingId === item.id;

              return (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-teal-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                >
                  {/* Left: Queue Number & Details */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Number Badge */}
                    <div className="flex items-center justify-center min-w-[76px] px-3 py-2 rounded-lg bg-teal-50 border border-teal-200 text-teal-900 font-mono font-black text-base tracking-wide shrink-0">
                      {formattedNum}
                    </div>

                    {/* Department & Time */}
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 truncate">
                        <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{dept}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>Daftar: {formatTime(item.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Call Button */}
                  <Button
                    size="sm"
                    onClick={() => onCallQueue && onCallQueue(item)}
                    disabled={isCallingThis || !canCallQueue}
                    className="h-8 px-3 text-xs font-semibold gap-1.5 bg-teal-600 hover:bg-teal-700 text-white shadow-none shrink-0"
                    title={
                      canCallQueue
                        ? `Panggil nomor ${formattedNum}`
                        : 'Hanya Resepsionis atau Admin yang dapat memanggil antrean'
                    }
                  >
                    {isCallingThis ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5 text-teal-100" />
                    )}
                    <span>Panggil</span>
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
