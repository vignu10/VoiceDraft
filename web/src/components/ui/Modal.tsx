'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
  footer?: React.ReactNode;
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  variant = 'default',
  children,
  footer,
  showCloseButton = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus the modal
      modalRef.current?.focus();

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Trap focus within modal
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      const firstElement = focusableElements?.[0] as HTMLElement;
      const lastElement = focusableElements?.[
        (focusableElements?.length || 0) - 1
      ] as HTMLElement;

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement?.focus();
            e.preventDefault();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);

      return () => {
        document.removeEventListener('keydown', handleTabKey);
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const headerIcon = variant === 'destructive' ? (
    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 dark:bg-accent-900/30 sm:mx-0 sm:h-10 sm:w-10">
      <svg
        className="h-6 w-6 text-accent-500"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
        />
      </svg>
    </div>
  ) : null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          ref={modalRef}
          tabIndex={-1}
          className={cn(
            'relative transform overflow-hidden rounded-2xl',
            'bg-white dark:bg-neutral-900',
            'text-left shadow-xl transition-all',
            'w-full max-w-md',
            'my-8 sm:my-0'
          )}
        >
          {/* Header */}
          <div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className={cn('sm:flex sm:items-start', variant === 'destructive' && 'sm:items-start')}>
              {headerIcon}
              <div className={cn('mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left', variant === 'destructive' && 'w-full')}>
                <h3
                  className="text-xl font-semibold leading-6 text-neutral-900 dark:text-neutral-100"
                  id="modal-title"
                >
                  {title}
                </h3>
                <div className="mt-4">
                  {children}
                </div>
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg p-1"
                  aria-label="Close modal"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 bg-neutral-50 dark:bg-neutral-800/50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
