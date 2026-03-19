/**
 * Console easter eggs for curious developers
 * Adds personality when someone opens the browser console
 */

const EASTER_EGGS = [
  {
    condition: () => Math.random() < 0.3,
    messages: [
      '%c🎤 VoiceScribe',
      'color: #0891b2; font-size: 24px; font-weight: bold;',
      '',
      'Like what you see? We\'re building the future of voice-powered content.',
      'Check out our code or say hi!',
    ],
  },
  {
    condition: () => Math.random() < 0.2,
    messages: [
      '%c🔍 Found the console? Nice!',
      'color: #0891b2; font-size: 20px; font-weight: bold;',
      '',
      'You\'re probably looking for something interesting.',
      'How about you try recording your voice instead?',
    ],
  },
  {
    condition: () => Math.random() < 0.15,
    messages: [
      '%c✨ A curious explorer!',
      'color: #0891b2; font-size: 18px; font-weight: bold;',
      '',
      'VoiceScribe is built with Next.js, React, and lots of ☕',
      'Thanks for stopping by.',
    ],
  },
  {
    condition: () => true, // Always show at least one message
    messages: [
      '%cVoiceScribe',
      'color: #0891b2; font-size: 16px; font-weight: bold;',
      'Built with ❤️ for creators who speak their mind',
    ],
  },
];

/**
 * Initialize console easter eggs
 * Call this once in your app's entry point
 */
export function initConsoleEasterEggs() {
  // Only run in production and not too frequently
  if (typeof window === 'undefined') return;

  // Small delay to not impact initial load
  setTimeout(() => {
    // Pick a random easter egg that matches its condition
    const availableEggs = EASTER_EGGS.filter(egg => egg.condition());
    const selectedEgg = availableEggs[Math.floor(Math.random() * availableEggs.length)];

    if (selectedEgg) {
      console.log(...selectedEgg.messages);
    }
  }, 1000);
}

/**
 * Konami code easter egg
 * ↑ ↑ ↓ ↓ ← → ← → B A
 */
export function initKonamiCode(callback: () => void) {
  if (typeof window === 'undefined') return;

  const konamiCode = [
    'ArrowUp', 'ArrowUp',
    'ArrowDown', 'ArrowDown',
    'ArrowLeft', 'ArrowRight',
    'ArrowLeft', 'ArrowRight',
    'KeyB', 'KeyA',
  ];

  let index = 0;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === konamiCode[index]) {
      index++;
      if (index === konamiCode.length) {
        callback();
        index = 0;
      }
    } else {
      index = 0;
    }
  };

  document.addEventListener('keydown', handleKeyDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
}
