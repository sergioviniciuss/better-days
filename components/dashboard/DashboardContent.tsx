'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChallengeTabs } from './ChallengeTabs';
import { detectPendingDays, groupPendingDaysByObjective, getTodayInTimezone } from '@/lib/streak-utils';
import { GroupedPendingDaysModal } from './GroupedPendingDaysModal';
import { checkReminder, setReminder } from '@/lib/reminder-utils';

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
  startDate: string;
  challengeType?: string;
  logs: DailyLog[];
  todayLog?: DailyLog | null;
  shortId?: string;
  dueDate?: string | null;
  userJoinedAt?: string;
  userStatus?: string;
  userLeftAt?: string;
  owner?: {
    email: string;
  };
  members?: Array<any>;
}

interface DashboardContentProps {
  user: User;
  challengesWithLogs: ChallengeWithLogs[];
}

export function DashboardContent({ user, challengesWithLogs }: DashboardContentProps) {
  const t = useTranslations('dashboard');
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [activeObjectiveGroup, setActiveObjectiveGroup] = useState<string | null>(null);

  // Separate solo and group challenges
  const soloChallenges = challengesWithLogs.filter(c => c.challengeType === 'PERSONAL');
  const groupChallenges = challengesWithLogs.filter(c => c.challengeType === 'GROUP');

  // Create todayLogs Map for tabs component
  const todayLogs = new Map(
    challengesWithLogs.map(c => [c.id, c.todayLog])
  );

  // Calculate grouped pending days
  const today = getTodayInTimezone(user.timezone);
  const challengesWithPending = challengesWithLogs.map(c => ({
    id: c.id,
    name: c.name,
    objectiveType: c.objectiveType,
    startDate: c.startDate,
    userJoinedAt: c.userJoinedAt,
    pendingDays: detectPendingDays(
      c.logs,
      user.timezone,
      c.userJoinedAt || c.startDate
    ).filter(date => date !== today) // Exclude today
  }));
  
  const groupedPendingDays = groupPendingDaysByObjective(
    challengesWithPending,
    user.timezone
  );

  // Auto-open modal for first group with pending days
  useEffect(() => {
    if (groupedPendingDays.length > 0 && !showPendingModal) {
      const firstGroup = groupedPendingDays[0];
      const reminderKey = `pending_${firstGroup.objectiveType}`;
      
      if (!checkReminder(reminderKey)) {
        setActiveObjectiveGroup(firstGroup.objectiveType);
        setShowPendingModal(true);
      }
    }
  }, [groupedPendingDays, showPendingModal]);

  const handleRemindLater = () => {
    if (activeObjectiveGroup) {
      setReminder(`pending_${activeObjectiveGroup}`, 2);
    }
    setShowPendingModal(false);
    setActiveObjectiveGroup(null);
  };

  const handleOpenModal = (objectiveType: string) => {
    setActiveObjectiveGroup(objectiveType);
    setShowPendingModal(true);
  };

  const activeGroup = groupedPendingDays.find(
    g => g.objectiveType === activeObjectiveGroup
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {t('title')}
      </h1>

      {/* Challenge Tabs */}
      <ChallengeTabs 
        soloChallenges={soloChallenges}
        groupChallenges={groupChallenges}
        todayLogs={todayLogs}
        userId={user.id}
        userTimezone={user.timezone}
        groupedPendingDays={groupedPendingDays}
        onOpenPendingModal={handleOpenModal}
      />

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

      {/* Grouped Pending Days Modal */}
      {showPendingModal && activeGroup && (
        <GroupedPendingDaysModal
          group={activeGroup}
          onClose={handleRemindLater}
          onRemindLater={handleRemindLater}
          userTimezone={user.timezone}
        />
      )}
    </div>
  );
}

