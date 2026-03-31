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
      {/* Mobile TOC Toggle with delight styling */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden mb-4 w-full rounded-full border border-accent/20 bg-gradient-to-r from-accent/5 to-accent/10 p-3 text-left shadow-sm transition-shadow hover:shadow-md dark:border-accent/10"
      >
        <span className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white">
          <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
          </svg>
          {isMobileOpen ? 'Hide' : 'Show'} Table of Contents
        </span>
      </button>

      {/* TOC Sidebar with delight styling */}
      <nav
        className={cn(
          'lg:sticky lg:top-20 lg:self-start',
          isMobileOpen ? 'block' : 'hidden lg:block'
        )}
      >
        <div className="rounded-2xl border border-accent/10 bg-gradient-to-b from-white to-neutral-50 p-4 shadow-sm dark:from-neutral-900 dark:to-neutral-800/50">
          {/* Header with gradient accent */}
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1 w-6 rounded-full bg-gradient-to-r from-accent to-accent-light" />
            <h3 className="font-semibold text-neutral-900 dark:text-white">
              On This Page
            </h3>
          </div>
          <ul className="space-y-1">
            {tocHeadings.map((heading, index) => (
              <li key={heading.id}>
                <a
                  href={`#${heading.id}`}
                  className={cn(
                    'group relative block rounded-lg px-3 py-2 text-sm transition-colors',
                    heading.level === 3 && 'pl-6',
                    activeId === heading.id
                      ? 'bg-gradient-to-r from-accent/10 to-accent/5 font-semibold text-accent shadow-sm'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white',
                    // Add subtle animation for each item
                    'animate-in fade-in slide-in-from-left-2',
                    `animation-delay-${Math.min(index * 50, 300)}`
                  )}
                  style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(heading.id)?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'start',
                    });
                    setIsMobileOpen(false);
                  }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {activeId === heading.id && (
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                    )}
                    {heading.text}
                  </span>
                  {activeId === heading.id && (
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-accent/5 to-transparent" />
                  )}
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
