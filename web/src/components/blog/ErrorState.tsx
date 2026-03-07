interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center py-16 text-center">
      <svg
        className="mb-4 h-16 w-16 text-amber-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Oops! Something went wrong</h3>
      <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
        {message || 'Failed to load posts. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded bg-stone-900 px-4 py-2 font-medium text-white transition-colors hover:bg-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
