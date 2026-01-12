'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserProfileMenu } from './UserProfileMenu';
import { MobileMenu } from './MobileMenu';

interface NavigationProps {
  userEmail?: string | null;
}

export function Navigation({ userEmail }: NavigationProps) {
  const [clientPathname, setClientPathname] = useState<string | null>(null);
  const tDashboard = useTranslations('dashboard');
  const tHistory = useTranslations('history');
  const tChallenges = useTranslations('challenges');
  
  // Get pathname - but ONLY use it on the client
  const pathname = usePathname();
  
  // Sync pathname to state after mount
  useEffect(() => {
    setClientPathname(pathname);
  }, [pathname]);
  
  // Use clientPathname only if available (client-side), otherwise fallback to /en
  const activePath = clientPathname || '/en';
  const locale = activePath.split('/')[1] || 'en';

  // Only create navItems if user is authenticated
  const navItems = userEmail ? [
    { href: `/${locale}/dashboard`, label: tDashboard('title') },
    { href: `/${locale}/history`, label: tHistory('title') },
    { href: `/${locale}/challenges`, label: tChallenges('title') },
  ] : [];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}/dashboard`} className="text-xl font-bold text-gray-900 dark:text-white">
              Better Habits
            </Link>
            {userEmail && (
              <div className="hidden md:flex space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium min-h-[44px] flex items-center ${
                      clientPathname && activePath === item.href
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {/* Language Switcher - Visible on all screens */}
            <LanguageSwitcher />
            
            {/* Desktop: User Profile Menu */}
            <div className="hidden md:block">
              <UserProfileMenu userEmail={userEmail} />
            </div>
            
            {/* Mobile: Hamburger Menu - Only show for authenticated users */}
            {userEmail && clientPathname && (
              <MobileMenu navItems={navItems} userEmail={userEmail} pathname={activePath} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
