'use client';

import { useTranslations } from 'next-intl';
import type { Timeframe } from '@/lib/types/public-habit';

interface LeaderboardTabsProps {
  currentTimeframe: Timeframe;
  slug: string;
  locale: string;
  onTabClick?: (timeframe: Timeframe) => void;
  isLoading?: boolean;
  loadingTimeframe?: Timeframe | null;
}

export const LeaderboardTabs = ({ 
  currentTimeframe, 
  slug, 
  locale,
  onTabClick,
  isLoading = false,
  loadingTimeframe = null
}: LeaderboardTabsProps) => {
  const t = useTranslations('publicChallenges');

  const tabs: { key: Timeframe; label: string }[] = [
    { key: 'MONTH', label: t('thisMonth') },
    { key: 'YEAR', label: t('thisYear') },
    { key: 'LIFETIME', label: t('lifetimeTab') },
  ];

  const handleTabClick = (timeframe: Timeframe) => {
    if (timeframe === currentTimeframe) return; // Don't navigate if already on this tab
    
    if (onTabClick) {
      onTabClick(timeframe);
    }
  };

  const isTabLoading = (tabKey: Timeframe) => {
    return isLoading && loadingTimeframe === tabKey;
  };

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {tabs.map(tab => {
        const isActive = currentTimeframe === tab.key;
        const isTabCurrentlyLoading = isTabLoading(tab.key);
        
        return (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab.key)}
            disabled={isActive || isTabCurrentlyLoading}
            className={`flex-1 md:flex-none px-6 py-3 font-medium text-sm md:text-base transition-colors relative ${
              isActive
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                : isTabCurrentlyLoading
                ? 'text-gray-400 dark:text-gray-500 cursor-wait'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer'
            }`}
          >
            {isTabCurrentlyLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg 
                  className="animate-spin h-4 w-4" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {tab.label}
              </span>
            ) : (
              tab.label
            )}
          </button>
        );
      })}
    </div>
  );
};
