import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VoiceDraft',
  description: 'Voice and text collaboration platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
