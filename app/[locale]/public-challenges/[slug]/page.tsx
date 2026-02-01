import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getPublicHabitDetail } from '@/app/actions/public-habit';
import { PublicHabitDetailHeader } from '@/components/public-challenges/PublicHabitDetailHeader';
import { LeaderboardSection } from '@/components/public-challenges/LeaderboardSection';
import type { Timeframe } from '@/lib/types/public-habit';

interface PageProps {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
  searchParams: Promise<{
    timeframe?: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const habitDetail = await getPublicHabitDetail(resolvedParams.slug, 'MONTH');
  
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
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  // Parse timeframe from searchParams, default to MONTH
  const timeframeParam = resolvedSearchParams.timeframe?.toUpperCase();
  const timeframe: Timeframe = 
    timeframeParam === 'YEAR' || timeframeParam === 'LIFETIME' 
      ? timeframeParam 
      : 'MONTH';

  // Fetch habit detail with leaderboard for selected timeframe
  const habitDetail = await getPublicHabitDetail(resolvedParams.slug, timeframe);

  if (!habitDetail) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <PublicHabitDetailHeader habit={habitDetail} hideButton={true} />

      {/* Leaderboard Section */}
      <LeaderboardSection 
        habitDetail={habitDetail}
        locale={resolvedParams.locale}
      />
    </div>
  );
}
