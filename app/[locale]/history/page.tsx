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

  // Pass user to avoid redundant getCurrentUser calls
  const { challenges } = await getChallenges(true, user);
  const { logs } = await getDailyLogs(undefined, user);

  return <HistoryContent logs={logs} challenges={challenges} userTimezone={user.timezone} />;
}
