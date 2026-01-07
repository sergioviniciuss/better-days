'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';

interface ProgressRingProps {
  activeDays: number;
  totalDays: number;
}

export function ProgressRing({ activeDays, totalDays }: ProgressRingProps) {
  const t = useTranslations('dashboard');
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const animationRef = useRef<number | null>(null);
  const isInitialMount = useRef(true);
  
  const percentage = totalDays > 0 ? Math.min((activeDays / totalDays) * 100, 100) : 0;
  
  // Responsive sizing: smaller on mobile, larger on desktop
  const sizes = {
    mobile: 100,    // xs/sm screens
    tablet: 120,    // md screens
    desktop: 140,   // lg+ screens
  };
  
  // Calculate for desktop size (used for SVG rendering)
  const size = sizes.desktop;
  const radius = (size - 20) / 2; // Account for stroke width (10px)
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;
  
  // Animate percentage display
  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayPercentage;
    const endValue = percentage;
    const duration = isInitialMount.current ? 1000 : 400; // 1000ms initial, 400ms updates
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentValue = startValue + (endValue - startValue) * eased;
      setAnimatedPercentage(currentValue);
      setDisplayPercentage(Math.round(currentValue));
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setAnimatedPercentage(endValue);
        setDisplayPercentage(Math.round(endValue));
        isInitialMount.current = false;
      }
    };
    
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [percentage, displayPercentage]);
  
  // Calculate gradient colors - use cyan tones
  const gradientId = `progress-gradient-${size}`;
  
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-6 min-h-[120px] md:min-h-[160px]">
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center h-full">
        {/* Ring with text overlay - responsive sizing via CSS */}
        <div className="relative w-[100px] h-[100px] md:w-[120px] md:h-[120px] lg:w-[140px] lg:h-[140px]">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full transform -rotate-90"
            aria-label={`Progress: ${activeDays} of ${totalDays} ${t('days')}`}
          >
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-gray-700"
            />
            {/* Progress circle with cyan gradient */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={`url(#${gradientId})`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transition: isInitialMount.current ? 'none' : 'stroke-dashoffset 400ms ease-out',
              }}
            />
          </svg>
          {/* Center text - positioned absolutely inside the ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {/* Large percentage */}
            <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-cyan-400 leading-none">
              {displayPercentage}%
            </div>
            {/* Active/Total */}
            <div className="text-xs sm:text-sm md:text-base text-white mt-0.5 md:mt-1">
              {activeDays}/{totalDays}
            </div>
            {/* Days label */}
            <div className="text-[10px] sm:text-xs text-cyan-300/70 mt-0.5 uppercase tracking-wide">
              {t('days')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
