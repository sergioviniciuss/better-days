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

  // Fetch all challenges to get their info
  const { challenges } = await getChallenges();
  
  // Fetch all logs (across all challenges)
  const { logs } = await getDailyLogs();

  return <HistoryContent logs={logs} challenges={challenges} />;
}
