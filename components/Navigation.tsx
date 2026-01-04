'use client';

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
  const tDashboard = useTranslations('dashboard');
  const tHistory = useTranslations('history');
  const tChallenges = useTranslations('challenges');
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'en';

  const navItems = [
    { href: `/${locale}/dashboard`, label: tDashboard('title') },
    { href: `/${locale}/history`, label: tHistory('title') },
    { href: `/${locale}/challenges`, label: tChallenges('title') },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href={`/${locale}/dashboard`} className="text-xl font-bold text-gray-900 dark:text-white">
              Better Habits
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium min-h-[44px] flex items-center ${
                    pathname === item.href
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Language Switcher - Visible on all screens */}
            <LanguageSwitcher />
            
            {/* Desktop: User Profile Menu */}
            <div className="hidden md:block">
              <UserProfileMenu userEmail={userEmail} />
            </div>
            
            {/* Mobile: Hamburger Menu */}
            <MobileMenu navItems={navItems} userEmail={userEmail} pathname={pathname} />
          </div>
        </div>
      </div>
    </nav>
  );
}
