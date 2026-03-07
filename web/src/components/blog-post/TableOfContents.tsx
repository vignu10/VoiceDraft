'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { TableOfContentsProps, Heading } from '@/types/blog-post';

export function TableOfContents({ headings, activeId, urlPrefix }: TableOfContentsProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Filter only H2 and H3 headings
  const tocHeadings = headings.filter(h => h.level >= 2 && h.level <= 3);

  if (tocHeadings.length === 0) {
    return null;
  }

  return (
    <>
      {/* Mobile TOC Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden mb-4 w-full rounded-lg border border-neutral-200 bg-white p-3 text-left dark:border-neutral-800 dark:bg-neutral-900"
      >
        <span className="font-medium text-neutral-900 dark:text-white">
          {isMobileOpen ? 'Hide' : 'Show'} Table of Contents
        </span>
      </button>

      {/* TOC Sidebar */}
      <nav
        className={cn(
          'lg:sticky lg:top-20 lg:self-start',
          isMobileOpen ? 'block' : 'hidden lg:block'
        )}
      >
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <h3 className="mb-3 font-semibold text-neutral-900 dark:text-white">
            On This Page
          </h3>
          <ul className="space-y-2">
            {tocHeadings.map((heading) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className={cn(
                    'block text-sm transition-colors hover:text-accent',
                    heading.level === 3 && 'pl-4',
                    activeId === heading.id
                      ? 'font-medium text-accent'
                      : 'text-neutral-600 dark:text-neutral-400'
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(heading.id)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                    setIsMobileOpen(false);
                  }}
                >
                  {heading.text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </>
  );
}

// Hook to detect active heading on scroll
export function useActiveHeading(headings: Heading[]) {
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-100px 0px -66%', threshold: 0 }
    );

    headings.forEach((heading) => {
      const element = document.getElementById(heading.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  return activeId;
}
