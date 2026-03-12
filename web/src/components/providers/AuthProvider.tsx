'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // This provider is now a simple pass-through
  // Zustand persist handles the persistence automatically
  return <>{children}</>;
}
