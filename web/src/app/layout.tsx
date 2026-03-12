import type { Metadata } from 'next';
import { Space_Grotesk, Outfit } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { Navigation } from '@/components/layout/Navigation';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { OfflineIndicator } from '@/components/ui/OfflineIndicator';
import { AppUpdateNotification } from '@/components/ui/AppUpdateNotification';
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
        <ToastProvider>
          <ThemeProvider>
            {/* Offline indicator */}
            <OfflineIndicator />

            {/* App update notification */}
            <AppUpdateNotification />

            {/* Skip to main content link for accessibility */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-4 focus:ring-primary-500/50 transition-all"
            >
              Skip to main content
            </a>

            {/* Navigation */}
            <Navigation />

            {/* Main content */}
            <main id="main" tabIndex={-1}>
              {children}
            </main>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
