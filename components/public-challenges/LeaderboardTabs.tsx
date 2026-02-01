'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { Timeframe } from '@/lib/types/public-habit';

interface LeaderboardTabsProps {
  currentTimeframe: Timeframe;
  slug: string;
  locale: string;
}

export const LeaderboardTabs = ({ currentTimeframe, slug, locale }: LeaderboardTabsProps) => {
  const t = useTranslations('publicChallenges');
  const router = useRouter();

  const tabs: { key: Timeframe; label: string }[] = [
    { key: 'MONTH', label: t('thisMonth') },
    { key: 'YEAR', label: t('thisYear') },
    { key: 'LIFETIME', label: t('lifetime') },
  ];

  const handleTabClick = (timeframe: Timeframe) => {
    router.push(`/${locale}/public-challenges/${slug}?timeframe=${timeframe.toLowerCase()}`);
  };

  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700">
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => handleTabClick(tab.key)}
          className={`flex-1 md:flex-none px-6 py-3 font-medium text-sm md:text-base transition-colors ${
            currentTimeframe === tab.key
              ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
