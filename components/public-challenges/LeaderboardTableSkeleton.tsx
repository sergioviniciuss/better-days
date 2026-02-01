'use client';

import type { Timeframe } from '@/lib/types/public-habit';

interface LeaderboardTableSkeletonProps {
  timeframe: Timeframe;
}

export const LeaderboardTableSkeleton = ({ timeframe }: LeaderboardTableSkeletonProps) => {
  const showCurrentStreakColumn = timeframe !== 'LIFETIME';
  
  return (
    <div className="overflow-x-auto">
      {/* Explanation text skeleton */}
      <div className="mb-4">
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-4 py-3 text-left">
              <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </th>
            <th className="px-4 py-3 text-left">
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </th>
            <th className="px-4 py-3 text-right">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto"></div>
            </th>
            {showCurrentStreakColumn ? (
              <th className="px-4 py-3 text-right">
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto"></div>
              </th>
            ) : null}
            <th className="px-4 py-3 text-right">
              <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto"></div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right">
                <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto"></div>
              </td>
              {showCurrentStreakColumn ? (
                <td className="px-4 py-4 whitespace-nowrap text-right">
                  <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto"></div>
                </td>
              ) : null}
              <td className="px-4 py-4 whitespace-nowrap text-right">
                <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse ml-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
