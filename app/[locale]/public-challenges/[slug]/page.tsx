import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getPublicHabitDetail } from '@/app/actions/public-habit';
import { PublicHabitDetailHeader } from '@/components/public-challenges/PublicHabitDetailHeader';
import { LeaderboardTabs } from '@/components/public-challenges/LeaderboardTabs';
import { PublicLeaderboardTable } from '@/components/public-challenges/PublicLeaderboardTable';
import type { Timeframe } from '@/lib/types/public-habit';

interface PageProps {
  params: {
    locale: string;
    slug: string;
  };
  searchParams: {
    timeframe?: string;
  };
}

export async function generateMetadata({ params }: PageProps) {
  const habitDetail = await getPublicHabitDetail(params.slug, 'MONTH');
  
  if (!habitDetail) {
    return {
      title: 'Not Found - Better Habits',
    };
  }

  return {
    title: `${habitDetail.title} - Public Challenges - Better Habits`,
    description: habitDetail.description || 'Join this public challenge and build better habits together.',
  };
}

export default async function PublicHabitDetailPage({ params, searchParams }: PageProps) {
  // Parse timeframe from searchParams, default to MONTH
  const timeframeParam = searchParams.timeframe?.toUpperCase();
  const timeframe: Timeframe = 
    timeframeParam === 'YEAR' || timeframeParam === 'LIFETIME' 
      ? timeframeParam 
      : 'MONTH';

  // Fetch habit detail with leaderboard for selected timeframe
  const habitDetail = await getPublicHabitDetail(params.slug, timeframe);

  if (!habitDetail) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <PublicHabitDetailHeader habit={habitDetail} />

      {/* Leaderboard Section */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {/* Tabs */}
        <LeaderboardTabs 
          currentTimeframe={habitDetail.timeframe}
          slug={habitDetail.slug}
          locale={params.locale}
        />

        {/* Leaderboard Table */}
        <div className="mt-6">
          <PublicLeaderboardTable 
            entries={habitDetail.leaderboard}
            timeframe={habitDetail.timeframe}
          />
        </div>
      </div>
    </div>
  );
}
