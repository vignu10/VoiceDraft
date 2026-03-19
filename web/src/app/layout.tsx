import { Navigation } from "@/components/layout/Navigation";
import { SessionExpirationHandler } from "@/components/providers/SessionExpirationHandler";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { ThemeProvider } from "@/components/theme-provider";
import { AppUpdateNotification } from "@/components/ui/AppUpdateNotification";
import { PWAInstallPrompt } from "@/components/ui/PWAInstallPrompt";
import { Analytics } from "@/components/analytics/Analytics";
import { DialogProvider } from "@/components/ui/dialog";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { EasterEggs } from "@/components/EasterEggs";
import type { Metadata, Viewport } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

// Force dynamic rendering to avoid build-time prerendering issues
export const dynamic = "force-dynamic";

// Bold, distinctive typography pairing for tech-savvy creators
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
  weight: ["500", "600", "700"],
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "VoiceScribe - Voice & Text Collaboration",
  description:
    "Transform voice into polished blog posts. A modern platform for creators who speak their mind.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VoiceScribe",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "theme-color": "#0891b2",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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
      style={{ fontFamily: "var(--font-body)" }}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#0891b2" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Service Worker Registration
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js', {
                    scope: '/'
                  }).then((registration) => {
                    console.log('[SW] Service worker registered:', registration.scope);

                    // Listen for waiting service worker
                    if (registration.waiting) {
                      // Notify about update
                      window.dispatchEvent(new CustomEvent('sw-waiting'));
                    }

                    // Listen for new service worker installing
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && registration.active) {
                            // New worker is waiting, notify about update
                            window.dispatchEvent(new CustomEvent('sw-waiting'));
                          }
                        });
                      }
                    });
                  }).catch((error) => {
                    console.error('[SW] Service worker registration failed:', error);
                  });
                });
              }

              // Handle service worker messages
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.addEventListener('message', (event) => {
                  if (event.data && event.data.type === 'SKIP_WAITING') {
                    navigator.serviceWorker.ready.then((registration) => {
                      if (registration.waiting) {
                        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                      }
                    });
                  }
                });
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('voicescribe-theme');
                  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : (theme || (systemDark ? 'dark' : 'light'));
                  if (resolvedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.add('light');
                  }
                } catch (e) {
                  console.error('Theme script error:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <DialogProvider>
          <ToastProvider>
            <ThemeProvider>
              {/* Session expiration handler */}
              <SessionExpirationHandler />

              {/* Analytics */}
              <Analytics />

              {/* Offline indicator */}
              <OfflineIndicator />

              {/* App update notification */}
              <AppUpdateNotification />

              {/* PWA install prompt */}
              <PWAInstallPrompt />

              {/* Easter eggs for curious developers */}
              <EasterEggs />

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
        </DialogProvider>
      </body>
    </html>
  );
}
