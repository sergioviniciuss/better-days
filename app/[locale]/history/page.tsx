import { getCurrentUser } from '@/app/actions/auth';
import { getChallenges } from '@/app/actions/challenge';
import { getDailyLogs } from '@/app/actions/daily-log';
import { redirect } from 'next/navigation';
import { HistoryContent } from '@/components/history/HistoryContent';

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  // OPTIMIZATION: Fetch challenges and logs in parallel instead of sequential
  const [challengesResult, logsResult] = await Promise.all([
    getChallenges(true, user),
    getDailyLogs(undefined, user)
  ]);
  
  const { challenges } = challengesResult;
  const { logs } = logsResult;

  return <HistoryContent logs={logs} challenges={challenges} userTimezone={user.timezone} />;
}
