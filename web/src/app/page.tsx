'use client';

import { HeroSection } from '@/components/discover/HeroSection';
import { WithBottomNav } from '@/components/layout/BottomNav';

export default function HomePage() {
  return (
    <WithBottomNav>
      <main>
        <HeroSection />
      </main>
    </WithBottomNav>
  );
}
