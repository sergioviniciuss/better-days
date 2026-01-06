import { getCurrentUser } from '@/app/actions/auth';
import { getDailyLogs } from '@/app/actions/daily-log';
import { getChallenges } from '@/app/actions/challenge';
import { redirect } from 'next/navigation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { getTodayInTimezone } from '@/lib/date-utils';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // Check onboarding from user object (no separate query needed)
  if (!user.hasCompletedOnboarding) {
    redirect(`/${locale}/onboarding`);
  }

  // Get challenges passing user to avoid redundant getCurrentUser call
  const { challenges } = await getChallenges(false, user);

  // Handle empty challenges case
  if (!challenges || challenges.length === 0) {
    return <DashboardContent user={user} challengesWithLogs={[]} />;
  }

  // OPTIMIZED: Fetch ALL logs in ONE query instead of per-challenge
  const { logs: allLogs } = await getDailyLogs(undefined, user);
  
  // Get today's date for filtering
  const today = getTodayInTimezone(user.timezone);

  // Map logs to challenges in memory (no DB calls)
  const challengesWithLogs = challenges.map((challenge: any) => {
    const logs = allLogs.filter((log: any) => log.challengeId === challenge.id);
    const todayLog = logs.find((log: any) => log.date === today) || null;
    
    return {
      ...challenge,
      logs,
      todayLog,
      challengeType: challenge.challengeType || 'PERSONAL'
    };
  });

  return <DashboardContent user={user} challengesWithLogs={challengesWithLogs} />;
}

