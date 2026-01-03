'use client';

import { useTranslations } from 'next-intl';

interface JoinChallengeContentProps {
  error: string;
  inviteCode: string;
}

export function JoinChallengeContent({ error, inviteCode }: JoinChallengeContentProps) {
  const t = useTranslations('joinChallenge');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {t('title')}
        </h1>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
          {error}
        </div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Invite Code: <strong>{inviteCode}</strong>
        </p>
      </div>
    </div>
  );
}
