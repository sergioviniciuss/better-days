'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { LeaderboardTabs } from './LeaderboardTabs';
import { PublicLeaderboardTable } from './PublicLeaderboardTable';
import { LeaderboardTableSkeleton } from './LeaderboardTableSkeleton';
import type { PublicHabitDetail, Timeframe } from '@/lib/types/public-habit';

interface LeaderboardSectionProps {
  habitDetail: PublicHabitDetail;
  locale: string;
}

export const LeaderboardSection = ({ habitDetail, locale }: LeaderboardSectionProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingTimeframe, setLoadingTimeframe] = useState<Timeframe | null>(null);

  const handleTabClick = (timeframe: Timeframe) => {
    if (timeframe === habitDetail.timeframe) return; // Already on this tab
    
    setLoadingTimeframe(timeframe);
    startTransition(() => {
      router.push(`/${locale}/public-challenges/${habitDetail.slug}?timeframe=${timeframe.toLowerCase()}`);
    });
  };

  const isLoading = isPending && loadingTimeframe !== null;
  const displayTimeframe = isLoading && loadingTimeframe ? loadingTimeframe : habitDetail.timeframe;

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      {/* Tabs */}
      <LeaderboardTabs 
        currentTimeframe={habitDetail.timeframe}
        slug={habitDetail.slug}
        locale={locale}
        onTabClick={handleTabClick}
        isLoading={isLoading}
        loadingTimeframe={loadingTimeframe}
      />

      {/* Leaderboard Table or Skeleton */}
      <div className="mt-6">
        {isLoading ? (
          <LeaderboardTableSkeleton timeframe={displayTimeframe} />
        ) : (
          <PublicLeaderboardTable 
            entries={habitDetail.leaderboard}
            timeframe={habitDetail.timeframe}
          />
        )}
      </div>
    </div>
  );
};
