import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  // Array of notifications: [newest, ..., oldest]
  const [notifications, setNotifications] = useState([]);
  const exitingIdsRef = useRef(new Set());
  const [, forceUpdate] = useState(0);

  const closeNotification = useCallback((id) => {
    exitingIdsRef.current.add(id);
    forceUpdate((n) => n + 1);

    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      exitingIdsRef.current.delete(id);
      forceUpdate((n) => n + 1);
    }, 350); // Matches exit transition
  }, []);

  const showNotification = useCallback(
    ({ type = 'success', title, message, duration = 4000 }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const newNotification = {
        id,
        type,
        title,
        message,
        duration,
      };

      // Push to front of array so newest alert is on top, older alert pushes down
      setNotifications((prev) => [newNotification, ...prev]);

      if (duration > 0) {
        setTimeout(() => {
          closeNotification(id);
        }, duration);
      }
    },
    [closeNotification]
  );

  return (
    <NotificationContext.Provider value={{ showNotification, closeNotification }}>
      {children}

      {/* Global Toast Alert Container di Kanan Atas Layar */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none w-80 sm:w-96">
        {notifications.map((notif) => {
          const isExiting = exitingIdsRef.current.has(notif.id);

          return (
            <div
              key={notif.id}
              className="pointer-events-auto transition-all duration-350 ease-out"
              style={{
                animation: isExiting
                  ? 'slideOutToRight 0.35s cubic-bezier(0.4, 0, 1, 1) forwards'
                  : 'slideInFromRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              {/* Card Wrapper: Border tipis halus (border-neutral-200), rounded-lg, overflow-hidden */}
              <div className="relative overflow-hidden rounded-lg border border-neutral-200 bg-white text-slate-900 shadow-sm">
                <Alert className="border-0 bg-transparent shadow-none p-4 pr-10 pb-5">
                  {notif.type === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-teal-600" />
                  )}
                  {notif.type === 'error' && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  {notif.type === 'info' && (
                    <Info className="h-4 w-4 text-teal-600" />
                  )}

                  <AlertTitle className="font-semibold text-sm tracking-tight text-slate-900">
                    {notif.title}
                  </AlertTitle>
                  <AlertDescription className="text-xs text-slate-500 mt-1 font-normal leading-relaxed">
                    {notif.message}
                  </AlertDescription>

                  <button
                    onClick={() => closeNotification(notif.id)}
                    className="absolute right-3 top-3 p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label="Tutup notifikasi"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Alert>

                {/* Timer Progress Bar Menempel Full dari Ujung Kiri ke Ujung Kanan */}
                {notif.duration > 0 && !isExiting && (
                  <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-teal-50">
                    <div
                      className="h-full bg-teal-600"
                      style={{
                        animation: `toastProgress ${notif.duration}ms linear forwards`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
