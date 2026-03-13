'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Modal } from './Modal';

export type DialogVariant = 'default' | 'destructive' | 'warning' | 'success' | 'info';

export interface DialogOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

interface DialogContextValue {
  showDialog: (options: DialogOptions) => Promise<boolean>;
  hideDialog: () => void;
}

const DialogContext = createContext<DialogContextValue | undefined>(undefined);

// Provider component
export function DialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const resolveRef = React.useRef<(value: boolean) => void | undefined>(undefined);

  const showDialog = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog(options);
      setIsOpen(true);
      resolveRef.current = resolve;
    });
  }, []);

  const hideDialog = useCallback(() => {
    setIsOpen(false);
    // Delay clearing dialog to allow animation to complete
    setTimeout(() => setDialog(null), 200);
  }, []);

  const handleConfirm = async () => {
    if (dialog?.onConfirm) {
      await dialog.onConfirm();
    }
    resolveRef.current?.(true);
    hideDialog();
  };

  const handleCancel = async () => {
    if (dialog?.onCancel) {
      await dialog.onCancel();
    }
    resolveRef.current?.(false);
    hideDialog();
  };

  const handleClose = () => {
    resolveRef.current?.(false);
    hideDialog();
  };

  const value = { showDialog, hideDialog };

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog && (
        <Modal
          isOpen={isOpen}
          onClose={handleClose}
          title={dialog.title}
          variant={dialog.variant === 'destructive' ? 'destructive' : 'default'}
          footer={
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg font-medium transition-colors"
              >
                {dialog.cancelText || 'Cancel'}
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  dialog.variant === 'destructive'
                    ? 'bg-accent-600 hover:bg-accent-700 text-white'
                    : 'bg-primary-500 hover:bg-primary-600 text-white'
                }`}
              >
                {dialog.confirmText || 'Confirm'}
              </button>
            </>
          }
        >
          {dialog.message && (
            <p className="text-neutral-600 dark:text-neutral-400">{dialog.message}</p>
          )}
        </Modal>
      )}
    </DialogContext.Provider>
  );
}

// Hook to use dialog
export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
