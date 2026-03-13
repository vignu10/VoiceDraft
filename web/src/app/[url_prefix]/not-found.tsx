import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">404</h1>
        <p className="mt-2 text-base text-neutral-600 dark:text-neutral-400 sm:text-lg">
          Journal not found
        </p>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-500">
          The journal you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
