import { getCurrentUser } from '@/app/actions/auth';
import { getDailyLogs, getTodayLog } from '@/app/actions/daily-log';
import { getChallenges } from '@/app/actions/challenge';
import { redirect } from 'next/navigation';
import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { createClient } from '@/lib/supabase/server';

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

  // Check if user has completed onboarding
  const supabase = await createClient();
  const { data: userData } = await supabase
    .from('User')
    .select('hasCompletedOnboarding')
    .eq('id', user.id)
    .single();

  // Check if user has any challenges
  const { challenges } = await getChallenges();

  // If user hasn't completed onboarding or has no challenges, redirect to onboarding
  if (!userData?.hasCompletedOnboarding || !challenges || challenges.length === 0) {
    redirect(`/${locale}/onboarding`);
  }

  // Fetch logs and today's log for all challenges
  const challengesWithLogs = await Promise.all(
    challenges.map(async (challenge: any) => {
      const { logs } = await getDailyLogs(challenge.id);
      const { log: todayLog } = await getTodayLog(challenge.id);
      return { 
        ...challenge,
        logs, 
        todayLog,
        // Ensure challengeType defaults to PERSONAL if not set
        challengeType: challenge.challengeType || 'PERSONAL'
      };
    })
  );

  return <DashboardContent user={user} challengesWithLogs={challengesWithLogs} />;
}

