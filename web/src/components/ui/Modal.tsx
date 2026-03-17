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

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Focus management function - handles both initial and dynamic content
      const setupFocusTrap = () => {
        // Focus the modal container
        modalRef.current?.focus();

        // Get all focusable elements within modal
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements?.[0] as HTMLElement;
        const lastElement = focusableElements?.[
          (focusableElements?.length || 0) - 1
        ] as HTMLElement;

        // If no focusable elements, keep focus on modal
        if (!firstElement) {
          modalRef.current?.focus();
          return;
        }

        // Focus first element if not already focused on something inside
        if (!modalRef.current?.contains(document.activeElement)) {
          firstElement?.focus();
        }

        return { firstElement, lastElement };
      };

      // Initial focus setup
      let focusRefs = setupFocusTrap();

      // Handle tab key with current focusable elements
      const handleTabKey = (e: KeyboardEvent) => {
        // Re-query focusable elements in case DOM changed
        focusRefs = setupFocusTrap();
        const { firstElement, lastElement } = focusRefs;

        if (e.key !== 'Tab') return;
        if (!firstElement || !lastElement) return;

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

      // Set up a MutationObserver to handle dynamically added content
      const observer = new MutationObserver(() => {
        focusRefs = setupFocusTrap();
      });

      if (modalRef.current) {
        observer.observe(modalRef.current, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['tabindex', 'disabled', 'hidden'],
        });
      }

      return () => {
        document.removeEventListener('keydown', handleTabKey);
        observer.disconnect();
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

      {/* Modal panel - centered on desktop, bottom sheet on mobile */}
      <div className="flex min-h-full items-end justify-center sm:items-center p-0 sm:p-4">
        <div
          ref={modalRef}
          tabIndex={-1}
          className={cn(
            'relative transform overflow-hidden rounded-t-3xl sm:rounded-2xl',
            'bg-white dark:bg-neutral-900',
            'text-left shadow-2xl sm:shadow-xl transition-all',
            'w-full sm:max-w-md',
            'max-h-[90vh] sm:max-h-none',
            'my-0 sm:my-8'
          )}
        >
          {/* Header */}
          <div className="px-6 pt-6 pb-4 sm:px-6 sm:pb-4 sm:pt-5">
            <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
              {headerIcon}
              <div className={cn('mt-4 w-full', variant === 'destructive' && 'w-full')}>
                <h3
                  className="text-xl font-bold leading-6 text-neutral-900 dark:text-neutral-100"
                  id="modal-title"
                >
                  {title}
                </h3>
                <div className="mt-3">
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
            <div className="px-4 py-4 sm:py-3 sm:flex sm:flex-row-reverse sm:px-6 sm:gap-3 bg-neutral-50 dark:bg-neutral-800/50 border-t border-neutral-200 dark:border-neutral-800">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
