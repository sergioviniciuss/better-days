'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import Link from 'next/link';
import { CreateChallengeModal } from './CreateChallengeModal';
import { ChallengeIcon } from '@/lib/challenge-icons';

interface User {
  id: string;
  email: string;
  timezone: string;
  preferredLanguage: string;
}

interface Challenge {
  id: string;
  name: string;
  objectiveType?: string;
  startDate: string;
  rules: string[];
  owner: {
    id: string;
    email: string;
  };
  members: Array<{
    userId: string;
    role: string;
  }>;
}

interface ChallengesContentProps {
  user: User;
  challenges: Challenge[];
}

export function ChallengesContent({ user, challenges }: ChallengesContentProps) {
  const t = useTranslations('challenges');
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('title')}
        </h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium min-h-[44px]"
        >
          {t('createChallenge')}
        </button>
      </div>

      {challenges.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{t('noChallenges')}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium min-h-[44px]"
          >
            {t('createChallenge')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {challenges.map((challenge) => (
            <Link
              key={challenge.id}
              href={`/${user.preferredLanguage}/challenges/${challenge.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-md transition-shadow min-h-[44px]"
            >
              <div className="flex items-start gap-4 mb-4">
                <ChallengeIcon 
                  type={(challenge.objectiveType as any) || 'NO_SUGAR_STREAK'} 
                  size="lg" 
                />
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {challenge.name}
                  </h2>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Started: {new Date(challenge.startDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Members: {challenge.members.length}
              </p>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateChallengeModal
          onClose={() => setShowCreateModal(false)}
          userTimezone={user.timezone}
        />
      )}
    </div>
  );
}
