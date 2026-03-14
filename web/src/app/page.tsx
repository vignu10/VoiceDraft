'use client';

import { HeroSection } from '@/components/discover/HeroSection';
import { WithBottomNav } from '@/components/layout/BottomNav';

export default function HomePage() {
  return (
    <WithBottomNav>
      <main className="min-h-screen pb-16 lg:pb-0">
        <HeroSection />
      </main>
    </WithBottomNav>
  );
}
