export default function Loading() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="animate-pulse">
        <div className="h-64 bg-neutral-200 dark:bg-neutral-800" />
        <div className="container-wide py-8">
          <div className="h-8 w-3/4 bg-neutral-200 dark:bg-neutral-800 mb-4" />
          <div className="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-800 mb-8" />
          <div className="space-y-4">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800" />
            <div className="h-4 w-5/6 bg-neutral-200 dark:bg-neutral-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
