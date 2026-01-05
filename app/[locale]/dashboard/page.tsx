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

  // Only redirect to onboarding if user hasn't completed it
  if (!userData?.hasCompletedOnboarding) {
    redirect(`/${locale}/onboarding`);
  }

  // Check if user has any challenges
  const { challenges } = await getChallenges();

  // Allow empty challenges array - component will handle empty state
  const challengesWithLogs = challenges && challenges.length > 0
    ? await Promise.all(
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
      )
    : [];

  return <DashboardContent user={user} challengesWithLogs={challengesWithLogs} />;
}

