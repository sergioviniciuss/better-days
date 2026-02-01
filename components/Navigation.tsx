'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
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
  const tAchievements = useTranslations('achievements');
  const tNavigation = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const t = useTranslations('auth');
  const pathname = usePathname();
  const [showAchievementsBadge, setShowAchievementsBadge] = useState(false);
  
  // Parse locale from pathname - more reliable than useParams() which can fail during SSR
  const locale = pathname.split('/')[1] || 'en';

  // Check if user has visited achievements page
  useEffect(() => {
    const hasVisitedAchievements = localStorage.getItem('achievements_visited');
    setShowAchievementsBadge(!hasVisitedAchievements);
  }, []);

  // Mark achievements as visited when user navigates to it
  useEffect(() => {
    if (pathname.includes('/achievements')) {
      localStorage.setItem('achievements_visited', 'true');
      setShowAchievementsBadge(false);
    }
  }, [pathname]);

  // Create navItems - Public Challenges shown for all users
  const navItems = userEmail ? [
    { href: `/${locale}/dashboard`, label: tDashboard('title') },
    { href: `/${locale}/history`, label: tHistory('title') },
    { href: `/${locale}/challenges`, label: tChallenges('title') },
    { href: `/${locale}/public-challenges`, label: tNavigation('publicChallenges') },
    { href: `/${locale}/achievements`, label: tAchievements('title'), isNew: showAchievementsBadge },
  ] : [
    { href: `/${locale}/public-challenges`, label: tNavigation('publicChallenges') },
  ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link 
              href={userEmail ? `/${locale}/dashboard` : `/${locale}/public-challenges`} 
              className="text-xl font-bold text-gray-900 dark:text-white"
            >
              Better Habits
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <div key={item.href} className="relative">
                  <Link
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium min-h-[44px] flex items-center ${
                      pathname === item.href
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {item.label}
                  </Link>
                  {item.isNew && (
                    <span className="absolute -top-1.5 -right-1.5 px-1 py-0 text-[10px] font-semibold rounded bg-green-600 text-white whitespace-nowrap leading-tight">
                      {tCommon('new')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {/* Language Switcher - Visible on all screens */}
            <LanguageSwitcher />
            
            {/* Desktop: Show Login/Sign Up for unauthenticated, UserProfileMenu for authenticated */}
            <div className="hidden md:flex md:items-center md:space-x-2">
              {userEmail ? (
                <UserProfileMenu userEmail={userEmail} />
              ) : (
                <>
                  <Link
                    href={`/${locale}/login`}
                    className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md transition-colors min-h-[44px] flex items-center"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href={`/${locale}/login`}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 rounded-md transition-colors min-h-[44px] flex items-center"
                  >
                    {t('signup')}
                  </Link>
                </>
              )}
            </div>
            
            {/* Mobile: Hamburger Menu - Show for all users if nav items exist */}
            {navItems.length > 0 && (
              <MobileMenu navItems={navItems} userEmail={userEmail} pathname={pathname} />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
