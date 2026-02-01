'use client';

import { useTranslations } from 'next-intl';
import type { LeaderboardEntry, Timeframe } from '@/lib/types/public-habit';

interface PublicLeaderboardTableProps {
  entries: LeaderboardEntry[];
  timeframe: Timeframe;
}

export const PublicLeaderboardTable = ({ entries, timeframe }: PublicLeaderboardTableProps) => {
  const t = useTranslations('publicChallenges');

  // Dynamic column header based on timeframe
  const scoreLabel = timeframe === 'LIFETIME' 
    ? t('leaderboard.currentStreak')
    : t('leaderboard.bestStreak');

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 dark:text-gray-400">
          {t('noParticipants')}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Explanation */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        {timeframe === 'LIFETIME' ? (
          <p>{t('leaderboard.lifetimeExplanation')}</p>
        ) : timeframe === 'YEAR' ? (
          <p>{t('leaderboard.yearExplanation')}</p>
        ) : (
          <p>{t('leaderboard.monthExplanation')}</p>
        )}
      </div>
      
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('leaderboard.rank')}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('leaderboard.participant')}
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {scoreLabel}
            </th>
            {timeframe !== 'LIFETIME' ? (
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('leaderboard.currentStreak')}
              </th>
            ) : null}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {t('leaderboard.achievements')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {entries.map(entry => (
            <tr key={entry.rank} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <td className="px-4 py-4 whitespace-nowrap">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold ${
                  entry.rank === 1
                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                    : entry.rank === 2
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    : entry.rank === 3
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {entry.rank}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                {entry.displayName}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900 dark:text-white">
                {entry.score}
              </td>
              {timeframe !== 'LIFETIME' ? (
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-600 dark:text-gray-400">
                  {entry.currentStreak}
                </td>
              ) : null}
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  🏆 {entry.achievementCount}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
