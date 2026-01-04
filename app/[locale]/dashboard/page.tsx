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
  // #region agent log
  const startTime = Date.now();
  // #endregion
  
  const challengesWithLogs = await Promise.all(
    challenges.map(async (challenge) => {
      const { logs } = await getDailyLogs(challenge.id);
      const { log: todayLog } = await getTodayLog(challenge.id);
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/47edcfc9-24b8-4790-8f1d-efb2fa213a1f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:40',message:'Fetched data for challenge',data:{challengeId:challenge.id,logsCount:logs.length,hasTodayLog:!!todayLog,todayLogConfirmed:todayLog?.confirmedAt},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return { ...challenge, logs, todayLog };
    })
  );

  // #region agent log
  const endTime = Date.now();
  fetch('http://127.0.0.1:7243/ingest/47edcfc9-24b8-4790-8f1d-efb2fa213a1f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard/page.tsx:49',message:'All challenges data fetched',data:{challengesCount:challengesWithLogs.length,fetchDurationMs:endTime-startTime},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  return <DashboardContent user={user} challengesWithLogs={challengesWithLogs} />;
}

