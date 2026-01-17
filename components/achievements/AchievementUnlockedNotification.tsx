'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AchievementBadge } from './AchievementBadge';
import { markAchievementAsViewed } from '@/app/actions/achievement';
import { getHighestTierAchievement } from '@/lib/achievement-types';
import type { AchievementDefinition } from '@/lib/achievement-types';

interface AchievementUnlockedNotificationProps {
  achievements: Array<AchievementDefinition & {
    userAchievementId: string;
    earnedAt: Date | string;
  }>;
  onClose: () => void;
  locale: string;
}

export const AchievementUnlockedNotification = ({
  achievements,
  onClose,
  locale,
}: AchievementUnlockedNotificationProps) => {
  const t = useTranslations();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isPending, startTransition] = useTransition();
  
  const primaryAchievement = getHighestTierAchievement(achievements);
  const additionalCount = achievements.length - 1;

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 10);

    // Mark all achievements as viewed
    const markAsViewed = async () => {
      try {
        const results = await Promise.all(
          achievements.map(ach => markAchievementAsViewed(ach.userAchievementId))
        );
        
        // Check if any failed
        const failures = results.filter(r => !r.success);
        if (failures.length > 0) {
          console.error('Failed to mark some achievements as viewed:', failures);
          failures.forEach(f => console.error('Error:', f.error));
        } else {
          console.log('Successfully marked all achievements as viewed');
        }
      } catch (error) {
        console.error('Failed to mark achievements as viewed:', error);
      }
    };
    markAsViewed();
  }, [achievements]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleViewAll = () => {
    setIsLeaving(true);
    startTransition(() => {
      router.push(`/${locale}/achievements`);
    });
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
      {/* Backdrop */}
      <div
        className={`
          absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto
          transition-opacity duration-300
          ${isVisible && !isLeaving ? 'opacity-100' : 'opacity-0'}
        `}
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className={`
          relative z-10 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
          max-w-md w-full p-8
          pointer-events-auto
          transition-all duration-300
          ${isVisible && !isLeaving 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-90'
          }
        `}
      >
        {/* Confetti effect - simple CSS animation */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`
                absolute w-2 h-2 rounded-full
                ${i % 4 === 0 ? 'bg-yellow-400' : i % 4 === 1 ? 'bg-pink-400' : i % 4 === 2 ? 'bg-blue-400' : 'bg-green-400'}
                animate-confetti
              `}
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 animate-bounce">
            🎉 {achievements.length > 1 
              ? t('achievements.multipleAchievementsUnlocked', { 
                  count: achievements.length,
                  defaultValue: `${achievements.length} New Achievements Unlocked!` 
                })
              : t('achievements.newAchievement', { defaultValue: 'New Achievement Unlocked!' })
            }
          </h2>

          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('achievements.congratulations', { defaultValue: 'Congratulations!' })}
          </p>

          {/* Achievement badge - centered and larger */}
          <div className="flex justify-center mb-6">
            <AchievementBadge
              {...primaryAchievement}
              earned={true}
              earnedAt={primaryAchievement.earnedAt}
              size="lg"
              showTooltip={false}
            />
          </div>

          {/* Achievement details */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t(primaryAchievement.descriptionKey as any, { defaultValue: primaryAchievement.description })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {t('achievements.tier', { defaultValue: 'Tier:' })} <span className="font-semibold">{primaryAchievement.tier}</span>
            </p>
            {additionalCount > 0 && (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-3">
                {t('achievements.andMoreAchievements', { 
                  count: additionalCount,
                  defaultValue: `and ${additionalCount} more achievement(s)!` 
                })}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            {additionalCount > 0 && (
              <button
                onClick={handleViewAll}
                disabled={isPending}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait text-white rounded-lg font-semibold transition-colors min-h-[44px]"
              >
                {isPending 
                  ? t('common.loading', { defaultValue: 'Loading...' })
                  : t('achievements.viewAllAchievements', { defaultValue: 'View All Achievements' })
                }
              </button>
            )}
            <button
              onClick={handleClose}
              className={`w-full px-6 py-3 ${additionalCount > 0 ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} rounded-lg font-semibold transition-colors min-h-[44px]`}
            >
              {t('common.close', { defaultValue: 'Close' })}
            </button>
          </div>
        </div>
      </div>

      {/* CSS for confetti animation */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
};
