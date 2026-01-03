import { getCurrentUser } from '@/app/actions/auth';
import { getChallenge } from '@/app/actions/challenge';
import { getChallengeLeaderboard } from '@/app/actions/leaderboard';
import { getDailyLogs } from '@/app/actions/daily-log';
import { redirect } from 'next/navigation';
import { ChallengeDetailContent } from '@/components/challenges/ChallengeDetailContent';

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { challenge } = await getChallenge(id);
  if (!challenge) {
    redirect(`/${locale}/challenges`);
  }

  const { leaderboard } = await getChallengeLeaderboard(id);
  const { logs } = await getDailyLogs();

  return (
    <ChallengeDetailContent
      challenge={challenge}
      leaderboard={leaderboard}
      user={user}
      userLogs={logs}
    />
  );
}
