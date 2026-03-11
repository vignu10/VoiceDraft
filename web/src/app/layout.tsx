import type { Metadata } from 'next';
import { Space_Grotesk, Outfit } from 'next/font/google';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import './globals.css';

// Bold, distinctive typography pairing for tech-savvy creators
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  weight: ['500', '600', '700'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '500', '600'],
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
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${outfit.variable}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          {/* Skip to main content link for accessibility */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all"
          >
            Skip to main content
          </a>

          {/* Bold Navigation Bar - Dramatic and Distinctive */}
          <nav className="sticky top-0 z-50 border-b-2 border-neutral-200/80 bg-white/95 backdrop-blur-md dark:border-neutral-800/80 dark:bg-neutral-950/95" aria-label="Main navigation">
            <div className="container-wide">
              <div className="flex h-20 items-center justify-between">
                {/* VoiceDraft brand/logo - Bold and confident */}
                <Link
                  href="/"
                  className="group flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg"
                >
                  {/* Bold logo mark */}
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25 transition-all group-hover:shadow-xl group-hover:shadow-primary-500/35 group-hover:scale-105">
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3h-1c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1c.55 0 1.05.22 1.41.59.41L13 9H7v1l4-4 4z" />
                    </svg>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 transition-colors group-hover:text-primary-500 font-[family:var(--font-display)]">
                      VoiceDraft
                    </span>
                    <span className="text-[10px] font-medium tracking-wide text-neutral-500 dark:text-neutral-400 uppercase">
                      Speak. Create.
                    </span>
                  </div>
                </Link>

                {/* Right side navigation items */}
                <div className="flex items-center gap-4">
                  <Link
                    href="/#featured-blogs"
                    className="text-sm font-medium text-neutral-600 transition-colors hover:text-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded-lg px-3 py-2 dark:text-neutral-400"
                  >
                    Explore
                  </Link>
                  <Link
                    href="/api/auth/signin"
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition-all hover:shadow-xl hover:shadow-primary-500/35 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  >
                    Get Started
                  </Link>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </nav>

          {/* Main content */}
          <main id="main" tabIndex={-1}>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
