'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Mic, FileText, Globe, User } from 'lucide-react';

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navLinks: NavLink[] = [
  { href: '/record', label: 'Record', icon: <Mic className="w-6 h-6" /> },
  { href: '/drafts', label: 'Drafts', icon: <FileText className="w-6 h-6" /> },
  { href: '/discover', label: 'Discover', icon: <Globe className="w-6 h-6" /> },
  { href: '/profile', label: 'Profile', icon: <User className="w-6 h-6" /> },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="lg:hidden fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-800 z-40 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-around py-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex flex-col items-center px-4 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                {link.icon}
                <span className="text-xs mt-1 font-medium">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Reusable padding wrapper for pages with bottom nav
// Note: Pages using this wrapper should add pb-16 lg:pb-0 to their container
export function WithBottomNav({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
