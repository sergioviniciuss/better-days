'use client';

import { useTranslations } from 'next-intl';
import { calculateStreaks, detectPendingDays, type DailyLog as StreakDailyLog } from '@/lib/streak-utils';
import { useState } from 'react';
import { formatDateString } from '@/lib/date-utils';
import { JoinChallengeBanner } from './JoinChallengeBanner';
import { EditConfirmationsModal } from '@/components/dashboard/EditConfirmationsModal';

interface User {
  id: string;
  email: string;
  timezone: string;
  preferredLanguage: string;
}

interface Challenge {
  id: string;
  name: string;
  challengeType?: string;
  startDate: string;
  rules: string[];
  owner: {
    id: string;
    email: string;
  };
  invites: Array<{
    code: string;
  }>;
  members?: Array<{
    userId: string;
    user: {
      id: string;
      email: string;
    };
  }>;
  userJoinedAt?: string;
}

interface LeaderboardEntry {
  userId: string;
  email: string;
  currentStreak: number;
  bestStreak: number;
  pendingDays: number;
  confirmedToday: boolean;
}

interface DailyLog {
  id: string;
  date: string;
  consumedSugar: boolean;
  confirmedAt: Date | null;
}

interface ChallengeDetailContentProps {
  challenge: Challenge;
  leaderboard: LeaderboardEntry[];
  user: User;
  userLogs: DailyLog[];
  showJoinConfirmation?: boolean;
  inviteCode?: string;
  isMember?: boolean;
}

export function ChallengeDetailContent({
  challenge,
  leaderboard,
  user,
  userLogs,
  showJoinConfirmation = false,
  inviteCode: propInviteCode,
  isMember = true,
}: ChallengeDetailContentProps) {
  const t = useTranslations('challengeDetail');
  const tChallenges = useTranslations('challenges');
  const tJoin = useTranslations('joinChallenge');
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Calculate user's stats
  const streakLogs: StreakDailyLog[] = userLogs.map((log) => ({
    date: log.date,
    consumedSugar: log.consumedSugar,
    confirmedAt: log.confirmedAt,
  }));

  const { currentStreak, bestStreak } = calculateStreaks(streakLogs, user.timezone);
  const pendingDays = detectPendingDays(
    streakLogs, 
    user.timezone,
    challenge.userJoinedAt || challenge.startDate
  );

  const inviteCode = propInviteCode || challenge.invites[0]?.code || '';
  const inviteUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/${user.preferredLanguage}/join/${inviteCode}`
    : '';

  const copyInviteLink = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setInviteLinkCopied(true);
      setTimeout(() => setInviteLinkCopied(false), 2000);
    }
  };

  const memberCount = challenge.members?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {challenge.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Started: {formatDateString(challenge.startDate)}
        </p>
      </div>

      {/* Join Confirmation Banner */}
      {showJoinConfirmation && inviteCode && (
        <JoinChallengeBanner
          challengeId={challenge.id}
          challengeName={challenge.name}
          inviteCode={inviteCode}
          memberCount={memberCount}
          rules={challenge.rules}
        />
      )}

      {/* Challenge Rules Section - Only show if user is a member */}
      {isMember && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {tChallenges('rules')}
          </h2>
          {challenge.rules.length > 0 ? (
            <ul className="space-y-3">
              {challenge.rules.map((rule, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-700 dark:text-gray-300">
                  <svg 
                    className="w-5 h-5 mt-0.5 flex-shrink-0 text-blue-600 dark:text-blue-400" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                  <span>{tChallenges(rule as any)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 italic">
              {tJoin('noRules')}
            </p>
          )}
        </div>
      )}

      {/* User Status Card - Only show if user is a member */}
      {isMember && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('yourStatus')}
          </h2>
          <button
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium min-h-[44px]"
          >
            {t('editHistory')}
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('currentStreak')}</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {currentStreak}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('bestStreak')}</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {bestStreak}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('pendingDays')}</p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {pendingDays.length}
            </p>
          </div>
        </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {t('leaderboard')}
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('rank')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('user')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('currentStreak')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('bestStreak')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('pendingDays')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Today
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {leaderboard.map((entry, index) => (
                <tr
                  key={entry.userId}
                  className={entry.userId === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {entry.email}
                    {entry.userId === user.id && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {entry.currentStreak}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {entry.bestStreak}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {entry.pendingDays > 0 ? `+${entry.pendingDays}` : '0'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {entry.confirmedToday ? (
                      <span className="text-green-600 dark:text-green-400">
                        {t('confirmedToday')}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        {t('notConfirmedToday')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Section - Only show for GROUP challenges and if user is a member */}
      {isMember && challenge.challengeType === 'GROUP' && inviteCode && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {t('inviteSection')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t('inviteDescription')}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-md p-3">
              <code className="text-lg font-mono text-gray-900 dark:text-white">
                {inviteCode}
              </code>
            </div>
            <button
              onClick={copyInviteLink}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium min-h-[44px]"
            >
              {inviteLinkCopied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}
      
      {showEditModal && isMember && (
        <EditConfirmationsModal
          confirmedLogs={userLogs.filter(log => log.confirmedAt !== null).map(log => ({
            ...log,
            challengeId: challenge.id,
          }))}
          challenges={[{
            id: challenge.id,
            name: challenge.name,
            objectiveType: (challenge as any).objectiveType || 'NO_SUGAR_STREAK',
          }]}
          challengeId={challenge.id}
          userTimezone={user.timezone}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
