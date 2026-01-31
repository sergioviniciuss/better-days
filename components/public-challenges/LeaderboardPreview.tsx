'use client';

import { useTranslations } from 'next-intl';
import type { LeaderboardEntry } from '@/lib/types/public-challenge';

interface LeaderboardPreviewProps {
  entries: LeaderboardEntry[];
  maxEntries?: number;
}

export const LeaderboardPreview = ({ entries, maxEntries }: LeaderboardPreviewProps) => {
  const t = useTranslations('publicChallenges.leaderboard');
  
  const displayedEntries = maxEntries ? entries.slice(0, maxEntries) : entries;

  if (displayedEntries.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No participants yet
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">
                {t('rank')}
              </th>
              <th className="text-left py-2 px-2 font-medium text-gray-600 dark:text-gray-400">
                {t('participant')}
              </th>
              <th className="text-right py-2 px-2 font-medium text-gray-600 dark:text-gray-400">
                {t('score')}
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedEntries.map((entry) => (
              <tr
                key={entry.rank}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                  #{entry.rank}
                </td>
                <td className="py-2 px-2 text-gray-900 dark:text-white truncate max-w-[150px]">
                  {entry.displayName}
                </td>
                <td className="py-2 px-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                  {entry.score}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
