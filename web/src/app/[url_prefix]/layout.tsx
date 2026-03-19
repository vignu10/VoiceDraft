import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'VoiceScribe - Blog',
  description: 'Voice-to-blog platform',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
