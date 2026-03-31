'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mic, Cloud, Edit, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ContentGateProps {
  visible: boolean;
  onSignIn: () => void;
  onSignUp: () => void;
  scrollPercentage?: number;
  immediate?: boolean; // true if gate is shown immediately (not from scroll)
}

export function ContentGate({
  visible,
  onSignIn,
  onSignUp,
  scrollPercentage = 30,
  immediate = false,
}: ContentGateProps) {
  const [shouldRender, setShouldRender] = useState(visible);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      // Small delay for animation
      requestAnimationFrame(() => setIsAnimatingIn(true));
    } else {
      setIsAnimatingIn(false);
      // Wait for animation to finish before unmounting
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center pointer-events-none transition-opacity duration-200 ${
        isAnimatingIn ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="content-gate-title"
    >
      {/* Backdrop blur overlay - blocks interaction */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        aria-hidden="true"
      />

      {/* Gate content card */}
      <div
        className={`relative w-full max-w-lg mx-4 mb-8 sm:mb-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 sm:p-8 transition-opacity duration-300 pointer-events-auto ${
          isAnimatingIn
            ? 'translate-y-0 opacity-100 scale-100'
            : 'translate-y-8 opacity-0 scale-95'
        }`}
      >
        {/* Lock icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-950 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
        </div>

        {/* Title */}
        <h2
          id="content-gate-title"
          className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-100 text-center mb-3"
        >
          Sign in to view full content
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 text-center mb-6 leading-relaxed">
          {immediate
            ? "You've created a draft during your free trial. Create a free account to unlock unlimited voice-to-blog posts, access all your drafts from any device, and keep your content forever."
            : `You've viewed ${scrollPercentage}% of this post. Create a free account to unlock unlimited voice-to-blog posts and access all your drafts from any device.`}
        </p>

        {/* Benefits list */}
        <div className="space-y-3 mb-6">
          <BenefitItem icon={Mic} text="Unlimited voice recordings" />
          <BenefitItem icon={Cloud} text="Sync across devices" />
          <BenefitItem icon={Edit} text="Edit and export drafts" />
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onSignIn}
            variant="primary"
            className="flex-1 min-h-[48px] items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Button>
          <Button
            onClick={onSignUp}
            variant="secondary"
            className="flex-1 min-h-[48px]"
          >
            Create Free Account
          </Button>
        </div>
      </div>
    </div>
  );
}

// Benefit item component
function BenefitItem({
  icon: Icon,
  text,
}: {
  icon: typeof Mic;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-950 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
      </div>
      <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
        {text}
      </span>
    </div>
  );
}
