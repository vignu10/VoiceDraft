'use client';

import { useEffect } from 'react';
import { initConsoleEasterEggs, initKonamiCode } from '@/lib/console-easter-eggs';

/**
 * Initializes easter eggs when the app loads
 */
export function EasterEggs() {
  useEffect(() => {
    // Console easter eggs
    initConsoleEasterEggs();

    // Konami code: confetti celebration!
    const cleanupKonami = initKonamiCode(() => {
      const { celebrate } = require('@/lib/confetti');
      celebrate({ count: 150, duration: 5000 });
      console.log('%c🎉 KONAMI CODE ACTIVATED!', 'color: #0891b2; font-size: 20px; font-weight: bold;');
    });

    return cleanupKonami;
  }, []);

  return null;
}
