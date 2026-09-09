import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Building2,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { formatQueueNumber } from './queue-columns';

export function CurrentServingCard({
  currentQueue = null,
  totalWaiting = 0,
  totalServedToday = 0,
  isLoading = false,
}) {

  const formattedNumber = currentQueue
    ? formatQueueNumber(currentQueue.queue_number)
    : '- - -';

  const poliDepartment =
    currentQueue?.registration?.clinic_department ||
    currentQueue?.clinic_department ||
    '-';

  return (
    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col h-full">
      <CardHeader className="p-5 pb-3 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold tracking-wider uppercase text-teal-600">
            Current Serving
          </span>
          <CardTitle className="text-lg font-bold text-slate-900 mt-0.5">
            Nomor Antrean Sedang Dilayani
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="p-6 flex-1 flex flex-col justify-between space-y-6">
        {/* Token / Big Number Box */}
        <div className="flex flex-col items-center justify-center my-auto py-4">
          <div className="w-full max-w-sm py-8 px-6 rounded-2xl bg-white border-2 border-teal-500/40 text-center shadow-sm">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700/80">
              NOMOR ANTREAN
            </span>

            <div className="text-6xl sm:text-7xl md:text-8xl font-black font-mono tracking-wider text-teal-800 my-2 drop-shadow-xs select-none">
              {formattedNumber}
            </div>

            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                <Building2 className="h-3.5 w-3.5 text-teal-600" />
                <span>{poliDepartment}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Statistics Summary Bar */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-amber-800 font-medium">Sedang Menunggu</p>
              <p className="text-xl font-bold font-mono text-amber-950">
                {totalWaiting}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/80 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-teal-800 font-medium">Total Dilayani Hari Ini</p>
              <p className="text-xl font-bold font-mono text-teal-950">
                {totalServedToday}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
