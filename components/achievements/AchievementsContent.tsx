'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { AchievementBadge } from './AchievementBadge';
import { getUserAchievementProgress } from '@/app/actions/achievement';
import type { AchievementCategory, AchievementTier } from '@/lib/achievement-types';

interface Achievement {
  id: string;
  code: string;
  category: AchievementCategory;
  tier: AchievementTier;
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  iconEmoji: string;
  requirement: any;
  order: number;
  earned: boolean;
  earnedAt?: Date | string | null;
  viewedAt?: Date | string | null;
  userAchievementId?: string | null;
}

interface AchievementsContentProps {
  grouped: Record<AchievementCategory, Achievement[]>;
  stats: {
    totalEarned: number;
    totalAvailable: number;
    percentage: number;
    byTier: Record<AchievementTier, number>;
    mostRecent: any;
  };
  userId: string;
  userTimezone: string;
}

export const AchievementsContent = ({
  grouped,
  stats,
  userId,
  userTimezone,
}: AchievementsContentProps) => {
  const t = useTranslations();
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'ALL'>('ALL');
  const [selectedTier, setSelectedTier] = useState<AchievementTier | 'ALL'>('ALL');
  const [showOnlyEarned, setShowOnlyEarned] = useState(false);
  const [achievementProgress, setAchievementProgress] = useState<Record<string, any>>({});

  const categories: Array<AchievementCategory | 'ALL'> = ['ALL', 'STREAK', 'CONSISTENCY', 'SOCIAL', 'CHALLENGE'];
  const tiers: Array<AchievementTier | 'ALL'> = ['ALL', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'LEGENDARY'];

  // Get all achievements from grouped
  const allAchievements = Object.values(grouped).flat();

  // Filter achievements based on selected filters
  const filteredAchievements = allAchievements.filter(achievement => {
    if (selectedCategory !== 'ALL' && achievement.category !== selectedCategory) return false;
    if (selectedTier !== 'ALL' && achievement.tier !== selectedTier) return false;
    if (showOnlyEarned && !achievement.earned) return false;
    return true;
  }).sort((a, b) => a.order - b.order);

  // Load progress for unearned achievements
  useEffect(() => {
    const loadProgress = async () => {
      const unearnedAchievements = filteredAchievements.filter(a => !a.earned);
      const progressData: Record<string, any> = {};

      await Promise.all(
        unearnedAchievements.map(async (achievement) => {
          const { progress } = await getUserAchievementProgress(achievement.id, userId, userTimezone);
          if (progress) {
            progressData[achievement.id] = progress;
          }
        })
      );

      setAchievementProgress(progressData);
    };

    if (filteredAchievements.length > 0) {
      loadProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredAchievements.length, userId, userTimezone]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('achievements.title', { defaultValue: 'Achievements' })}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {t('achievements.subtitle', { 
            defaultValue: 'Earn badges by reaching milestones and completing challenges' 
          })}
        </p>
      </div>

      {/* Stats overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.totalEarned}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('achievements.earned', { defaultValue: 'Earned' })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-600 dark:text-gray-400">{stats.totalAvailable}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('achievements.total', { defaultValue: 'Total' })}
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.percentage}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('achievements.completion', { defaultValue: 'Completion' })}
            </p>
          </div>
          <div className="text-center">
            {stats.mostRecent ? (
              <>
                <p className="text-2xl mb-1">{stats.mostRecent.icon}</p>
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate max-w-[120px] mx-auto">
                  {t(stats.mostRecent.nameKey as any, { defaultValue: stats.mostRecent.name })}
                </p>
              </>
            ) : (
              <p className="text-2xl mb-1">🎯</p>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t('achievements.mostRecent', { defaultValue: 'Most Recent' })}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Category filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('achievements.category', { defaultValue: 'Category' })}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px]"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' 
                    ? t('achievements.allCategories', { defaultValue: 'All Categories' })
                    : t(`achievements.categories.${cat.toLowerCase()}`, { defaultValue: cat })
                  }
                </option>
              ))}
            </select>
          </div>

          {/* Tier filter */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('achievements.tier', { defaultValue: 'Tier' })}
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-h-[44px]"
            >
              {tiers.map(tier => (
                <option key={tier} value={tier}>
                  {tier === 'ALL'
                    ? t('achievements.allTiers', { defaultValue: 'All Tiers' })
                    : tier
                  }
                </option>
              ))}
            </select>
          </div>

          {/* Show only earned toggle */}
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={showOnlyEarned}
                onChange={(e) => setShowOnlyEarned(e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('achievements.showOnlyEarned', { defaultValue: 'Earned only' })}
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Achievements grid */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {filteredAchievements.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {filteredAchievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                {...achievement}
                earned={achievement.earned}
                earnedAt={achievement.earnedAt}
                progress={achievementProgress[achievement.id]}
                size="md"
                showProgress={true}
                showTooltip={true}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <p className="text-gray-600 dark:text-gray-400">
              {t('achievements.noResults', { 
                defaultValue: 'No achievements match your filters' 
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
