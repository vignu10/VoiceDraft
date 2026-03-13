'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { ToastContainer, type ToastType } from '@/components/ui/Toast';
import { syncManager } from '@/lib/sync-manager';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from 'next/navigation';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { sessionExpired } = useAuthStore();

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const success = useCallback((message: string) => showToast('success', message), [showToast]);
  const error = useCallback((message: string) => showToast('error', message), [showToast]);
  const warning = useCallback((message: string) => showToast('warning', message), [showToast]);
  const info = useCallback((message: string) => showToast('info', message), [showToast]);

  // Handle session expiration - redirect to signin and show toast
  useEffect(() => {
    if (sessionExpired) {
      error('Your session has expired. Please log in again.');
      // Use replace to prevent going back to the protected page
      router.replace('/auth/signin');
    }
  }, [sessionExpired, error, router]);

  // Auto-sync when coming online
  useEffect(() => {
    const handleOnline = async () => {
      const token = useAuthStore.getState().accessToken;
      if (token) {
        const results = await syncManager.processQueue(token);
        if (results) {
          if (results.successful.length > 0) {
            success(`Synced ${results.successful.length} item(s)`);
          }
          if (results.failed.length > 0) {
            warning(`${results.failed.length} item(s) failed to sync`);
          }
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [success, warning]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}
