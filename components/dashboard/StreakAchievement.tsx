'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

interface StreakAchievementProps {
  currentStreak: number;
  bestStreak: number;
  isMilestone?: boolean;
}

export function StreakAchievement({ currentStreak, bestStreak, isMilestone }: StreakAchievementProps) {
  const t = useTranslations('dashboard');
  const patternId = useId();

  return (
    <div 
      className={`relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6 min-h-[120px] md:min-h-[160px] ${
        isMilestone ? 'animate-pulse' : ''
      }`}
    >
      {/* Geometric pattern overlay - hidden on mobile for performance */}
      <div className="absolute inset-0 opacity-10 hidden md:block">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-cyan-400"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Large number - responsive sizing */}
        <div 
          className={`text-4xl md:text-6xl lg:text-7xl font-bold text-cyan-400 transition-transform ${
            isMilestone ? 'scale-110' : ''
          }`}
        >
          {currentStreak}
        </div>
        
        {/* "DAY STREAK!" text */}
        <div className="text-lg md:text-2xl font-bold text-white mt-1 md:mt-2 uppercase tracking-wider">
          {currentStreak === 1 ? t('daySingular') : t('dayPlural')} {t('streak')}!
        </div>
        
        {/* Best streak - smaller, below */}
        <div className="text-xs md:text-sm text-cyan-300/70 mt-2 md:mt-3 uppercase tracking-wide">
          {t('best')}: {bestStreak} {bestStreak === 1 ? t('daySingular').toLowerCase() : t('dayPlural').toLowerCase()} {t('streak').toLowerCase()}
        </div>
      </div>

      {/* Milestone celebration indicator */}
      {isMilestone && (
        <div className="absolute top-2 right-2 md:top-4 md:right-4">
          <span className="inline-flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-yellow-400 text-yellow-900 text-lg md:text-xl animate-bounce">
            🎉
          </span>
        </div>
      )}
    </div>
  );
}

