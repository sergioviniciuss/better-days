'use client';

import { useTranslations } from 'next-intl';
import { TIER_STYLES, type AchievementTier } from '@/lib/achievement-types';

interface AchievementBadgeProps {
  name: string;
  nameKey: string;
  description: string;
  descriptionKey: string;
  iconEmoji: string;
  tier: AchievementTier;
  earned: boolean;
  earnedAt?: Date | string | null;
  progress?: {
    current: number;
    target: number;
    percentage: number;
  };
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  showTooltip?: boolean;
}

export const AchievementBadge = ({
  name,
  nameKey,
  description,
  descriptionKey,
  iconEmoji,
  tier,
  earned,
  earnedAt,
  progress,
  size = 'md',
  showProgress = false,
  showTooltip = true,
}: AchievementBadgeProps) => {
  const t = useTranslations();
  const styles = TIER_STYLES[tier];

  // Size configurations
  const sizeClasses = {
    sm: {
      container: 'w-16 h-16',
      emoji: 'text-2xl',
      badge: 'text-xs px-1',
    },
    md: {
      container: 'w-24 h-24',
      emoji: 'text-4xl',
      badge: 'text-xs px-2 py-0.5',
    },
    lg: {
      container: 'w-32 h-32',
      emoji: 'text-5xl',
      badge: 'text-sm px-2 py-1',
    },
  };

  const sizeClass = sizeClasses[size];

  // Try to get translated name/description, fallback to provided values
  const displayName = nameKey ? t(nameKey as any, { defaultValue: name }) : name;
  const displayDescription = descriptionKey ? t(descriptionKey as any, { defaultValue: description }) : description;

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative group">
      {/* Badge container */}
      <div
        className={`
          ${sizeClass.container}
          relative
          flex flex-col items-center justify-center
          rounded-lg
          border-2
          ${earned ? styles.bg + ' ' + styles.border : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'}
          ${earned ? '' : 'opacity-40 grayscale'}
          transition-all duration-200
          hover:scale-105
          ${tier === 'LEGENDARY' && earned ? 'shadow-lg' : ''}
        `}
      >
        {/* Icon emoji */}
        <div className={`${sizeClass.emoji} ${earned ? '' : 'filter grayscale'}`}>
          {iconEmoji}
        </div>

        {/* Tier badge */}
        <div
          className={`
            absolute -top-2 -right-2
            ${sizeClass.badge}
            rounded-full
            font-semibold
            uppercase
            ${earned ? styles.bg + ' ' + styles.text + ' ' + styles.border : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600'}
            border
          `}
        >
          {tier[0]}
        </div>

        {/* Locked overlay */}
        {!earned && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 dark:bg-black/30 rounded-lg">
            <span className="text-2xl">🔒</span>
          </div>
        )}
      </div>

      {/* Progress bar (if enabled and not earned) */}
      {showProgress && !earned && progress && progress.target > 0 && (
        <div className="mt-2 w-full">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${tier === 'LEGENDARY' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : styles.bg}`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-1">
            {progress.current}/{progress.target}
          </p>
        </div>
      )}

      {/* Name */}
      <p className={`text-center mt-2 font-semibold ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'} ${earned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
        {displayName}
      </p>

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 w-max max-w-xs">
          <p className="font-semibold">{displayName}</p>
          <p className="text-xs text-gray-300 dark:text-gray-400 mt-1">{displayDescription}</p>
          {earned && earnedAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('achievements.earnedOn', { defaultValue: 'Earned:' })} {formatDate(earnedAt)}
            </p>
          )}
          {!earned && progress && progress.target > 0 && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {t('achievements.progress', { defaultValue: 'Progress:' })} {progress.current}/{progress.target} ({progress.percentage}%)
            </p>
          )}
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
          </div>
        </div>
      )}
    </div>
  );
};
