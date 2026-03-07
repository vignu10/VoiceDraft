import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-neutral-900 dark:text-white">404</h1>
        <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-400">
          Post not found
        </p>
        <p className="mt-2 text-neutral-500 dark:text-neutral-500">
          This post doesn't exist or isn't published.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 font-medium text-white transition-colors hover:bg-accent/90"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
