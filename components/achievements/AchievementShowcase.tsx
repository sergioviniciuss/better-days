'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import Link from 'next/link';
import { AchievementBadge } from './AchievementBadge';
import type { AchievementDefinition } from '@/lib/achievement-types';

interface AchievementShowcaseProps {
  recentAchievements: Array<AchievementDefinition & {
    earned: boolean;
    earnedAt?: Date | string | null;
  }>;
  totalEarned: number;
  totalAvailable: number;
  locale: string;
  onDismiss?: () => void;
}

export const AchievementShowcase = ({
  recentAchievements,
  totalEarned,
  totalAvailable,
  locale,
  onDismiss,
}: AchievementShowcaseProps) => {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const percentage = totalAvailable > 0 
    ? Math.round((totalEarned / totalAvailable) * 100) 
    : 0;

  const handleNavigate = () => {
    startTransition(() => {
      router.push(`/${locale}/achievements`);
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('achievements.title', { defaultValue: 'Achievements' })}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {totalEarned} {t('common.of', { defaultValue: 'of' })} {totalAvailable} {t('achievements.earned', { defaultValue: 'earned' })} ({percentage}%)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/achievements`}
            onClick={handleNavigate}
            className={`text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium hover:underline ${isPending ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isPending ? t('common.loading', { defaultValue: 'Loading...' }) : t('achievements.viewAll', { defaultValue: 'View All' })}
          </Link>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
              aria-label={t('common.close', { defaultValue: 'Close' })}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Recent achievements grid */}
      {recentAchievements.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
          {recentAchievements.map((achievement) => (
            <div key={achievement.id} className="flex justify-center">
              <AchievementBadge
                {...achievement}
                earned={achievement.earned}
                earnedAt={achievement.earnedAt}
                size="md"
                showProgress={false}
                showTooltip={true}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t('achievements.noAchievementsYet', { defaultValue: 'Start completing challenges to earn achievements!' })}
          </p>
        </div>
      )}

      {/* Call to action */}
      {recentAchievements.length > 0 && recentAchievements.length < totalAvailable && (
        <div className="mt-6 text-center">
          <Link
            href={`/${locale}/achievements`}
            onClick={handleNavigate}
            className={`inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors min-h-[44px] ${isPending ? 'opacity-75 cursor-wait' : ''}`}
          >
            {isPending ? t('common.loading', { defaultValue: 'Loading...' }) : t('achievements.viewAllBadges', { defaultValue: 'View All Badges' })}
          </Link>
        </div>
      )}
    </div>
  );
};
