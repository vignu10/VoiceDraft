import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VoiceDraft - Voice & Text Collaboration',
  description: 'Transform voice into polished blog posts. A modern platform for creators who speak their mind.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen font-sans">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-accent/50"
        >
          Skip to main content
        </a>

        {/* Navigation bar */}
        <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-950/95">
          <div className="container-wide">
            <div className="flex h-16 items-center justify-between">
              {/* VoiceDraft brand/logo */}
              <Link
                href="/"
                className="flex items-center gap-2 text-xl font-semibold text-neutral-900 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 dark:text-white"
              >
                <svg className="h-8 w-8 text-accent" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3h-1c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1c.55 0 1.05.22 1.41.59.41L13 9H7v1l4-4 4 4-4z" />
                </svg>
                <span>VoiceDraft</span>
              </Link>

              {/* Right side navigation items */}
              <div className="flex items-center gap-4">
                <Link
                  href="/#featured-blogs"
                  className="text-sm font-medium text-neutral-600 hover:text-accent transition-colors focus:outline-none focus:ring-2 focus:ring-accent/50 dark:text-neutral-400"
                >
                  Explore
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main id="main">
          {children}
        </main>
      </body>
    </html>
  );
}
