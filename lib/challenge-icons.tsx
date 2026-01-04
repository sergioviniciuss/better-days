import Image from 'next/image';

export type ChallengeType = 'NO_SUGAR_STREAK' | 'ZERO_ALCOHOL' | 'DAILY_EXERCISE' | 'READING' | 'MEDITATION';

interface ChallengeIconConfig {
  image?: string;
  emoji?: string;
  alt: string;
}

const CHALLENGE_ICONS: Record<ChallengeType, ChallengeIconConfig> = {
  NO_SUGAR_STREAK: {
    emoji: '🍬',
    alt: 'No Sugar Challenge'
  },
  ZERO_ALCOHOL: {
    emoji: '🚫',
    alt: 'Zero Alcohol Challenge'
  },
  DAILY_EXERCISE: {
    emoji: '💪',
    alt: 'Daily Exercise Challenge'
  },
  // Future challenge types can be added here
  READING: {
    emoji: '📚',
    alt: 'Reading Challenge'
  },
  MEDITATION: {
    emoji: '🧘',
    alt: 'Meditation Challenge'
  }
};

interface ChallengeIconProps {
  type: ChallengeType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

const SIZE_PIXELS = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96
};

export function ChallengeIcon({ type, size = 'md', className = '' }: ChallengeIconProps) {
  const config = CHALLENGE_ICONS[type] || CHALLENGE_ICONS.NO_SUGAR_STREAK;
  const sizeClass = SIZE_CLASSES[size];
  const sizePixels = SIZE_PIXELS[size];
  
  if (config.image) {
    return (
      <div className={`${sizeClass} ${className} flex items-center justify-center`}>
        <Image
          src={config.image}
          alt={config.alt}
          width={sizePixels}
          height={sizePixels}
          className="object-contain"
        />
      </div>
    );
  }
  
  // Fallback to emoji if no image
  const emojiSize = SIZE_PIXELS[size];
  return (
    <div 
      className={`flex items-center justify-center ${sizeClass} ${className}`}
      style={{ fontSize: `${emojiSize * 0.7}px` }}
    >
      {config.emoji}
    </div>
  );
}

export function getChallengeIcon(type: ChallengeType): ChallengeIconConfig {
  return CHALLENGE_ICONS[type] || CHALLENGE_ICONS.NO_SUGAR_STREAK;
}

