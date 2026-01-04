'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ChallengeCard } from './ChallengeCard';

interface User {
  id: string;
  email: string;
  timezone: string;
  preferredLanguage: string;
}

interface DailyLog {
  id: string;
  date: string;
  consumedSugar: boolean;
  confirmedAt: Date | null;
}

interface ChallengeWithLogs {
  id: string;
  name: string;
  objectiveType: string;
  rules: string[];
  logs: DailyLog[];
  todayLog?: DailyLog | null;
}

interface DashboardContentProps {
  user: User;
  challengesWithLogs: ChallengeWithLogs[];
}

export function DashboardContent({ user, challengesWithLogs }: DashboardContentProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {t('title')}
      </h1>

      {/* Render a card for each challenge */}
      {challengesWithLogs.map((challenge) => (
        <ChallengeCard
          key={challenge.id}
          challenge={challenge}
          logs={challenge.logs}
          todayLog={challenge.todayLog}
          userTimezone={user.timezone}
        />
      ))}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Link
          href={`/${user.preferredLanguage}/history`}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow min-h-[44px] flex items-center justify-center"
        >
          <span className="text-gray-900 dark:text-white font-medium">View History</span>
        </Link>
        <Link
          href={`/${user.preferredLanguage}/challenges`}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-md transition-shadow min-h-[44px] flex items-center justify-center"
        >
          <span className="text-gray-900 dark:text-white font-medium">Challenges</span>
        </Link>
      </div>
    </div>
  );
}

