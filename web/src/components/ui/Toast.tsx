'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  type: ToastType;
  message: string;
  duration?: number;
  onClose?: () => void;
}

const toastIcons = {
  success: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  error: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
    </svg>
  ),
  warning: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
};

const toastStyles = {
  success: 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  error: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  warning: 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
};

export const Toast: React.FC<ToastProps> = ({
  type,
  message,
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => setIsAnimating(true));

    // Auto-dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 200); // Match transition duration
  };

  if (!isVisible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg',
        'transition-all duration-200 ease-out',
        toastStyles[type],
        isAnimating ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full'
      )}
    >
      <div className="flex-shrink-0" aria-hidden="true">
        {toastIcons[type]}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        aria-label="Close notification"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

// Toast Container for managing multiple toasts
interface ToastContainerProps {
  toasts: Array<{ id: string; type: ToastType; message: string }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};
