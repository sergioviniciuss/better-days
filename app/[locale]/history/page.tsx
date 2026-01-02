import { getCurrentUser } from '@/app/actions/auth';
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

  const { logs } = await getDailyLogs();

  return <HistoryContent logs={logs} />;
}

