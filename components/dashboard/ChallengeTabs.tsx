'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChallengeCard } from './ChallengeCard';

interface Challenge {
  id: string;
  name: string;
  objectiveType: string;
  rules: string[];
  startDate: string;
  shortId?: string;
  dueDate?: string | null;
  challengeType?: string;
  userJoinedAt?: string;
  owner?: {
    email: string;
  };
  members?: Array<any>;
}

interface ChallengeTabsProps {
  soloChallenges: Challenge[];
  groupChallenges: Challenge[];
  todayLogs: Map<string, any>;
  userTimezone: string;
}

export function ChallengeTabs({ 
  soloChallenges, 
  groupChallenges, 
  todayLogs, 
  userTimezone 
}: ChallengeTabsProps) {
  const t = useTranslations('dashboard');
  const [activeTab, setActiveTab] = useState<'solo' | 'group'>('solo');

  const activeChallenges = activeTab === 'solo' ? soloChallenges : groupChallenges;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('solo')}
          className={`px-4 py-3 font-medium transition-colors relative min-h-[44px] ${
            activeTab === 'solo'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t('soloChallenges')} ({soloChallenges.length})
          {activeTab === 'solo' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('group')}
          className={`px-4 py-3 font-medium transition-colors relative min-h-[44px] ${
            activeTab === 'group'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          {t('groupChallenges')} ({groupChallenges.length})
          {activeTab === 'group' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
          )}
        </button>
      </div>

      {/* Challenge Cards */}
      {activeChallenges.length > 0 ? (
        <div className="space-y-6">
          {activeChallenges.map((challenge) => (
            <ChallengeCard
              key={challenge.id}
              challenge={challenge}
              logs={[]}
              todayLog={todayLogs.get(challenge.id) || null}
              userTimezone={userTimezone}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400">
            {activeTab === 'solo' ? t('noSoloChallenges') : t('noGroupChallenges')}
          </p>
        </div>
      )}
    </div>
  );
}

