export type ChallengeType = 'NO_SUGAR' | 'ZERO_ALCOHOL' | 'DAILY_EXERCISE';

export interface ChallengeTypeConfig {
  id: ChallengeType;
  name: string;
  nameKey: string; // i18n key
  description: string;
  descriptionKey: string; // i18n key
  icon: string; // emoji or path
  suggestedName: string; // placeholder
  suggestedNameKey: string; // i18n key
  defaultRules: string[];
  availableRules: string[]; // which rules apply to this challenge type
}

export const CHALLENGE_TYPES: Record<ChallengeType, ChallengeTypeConfig> = {
  NO_SUGAR: {
    id: 'NO_SUGAR',
    name: 'No Sugar Challenge',
    nameKey: 'noSugar.name',
    description: 'Track sugar-free days and build streaks',
    descriptionKey: 'noSugar.description',
    icon: '🍬',
    suggestedName: 'No Sugar Challenge',
    suggestedNameKey: 'noSugar.suggestedName',
    defaultRules: ['addedSugarCounts', 'fruitDoesNotCount'],
    availableRules: ['addedSugarCounts', 'fruitDoesNotCount', 'processedSugarOnly', 'alcoholPermitted', 'missingDaysPending']
  },
  ZERO_ALCOHOL: {
    id: 'ZERO_ALCOHOL',
    name: 'Zero Alcohol Challenge',
    nameKey: 'zeroAlcohol.name',
    description: 'Stay sober and track alcohol-free days',
    descriptionKey: 'zeroAlcohol.description',
    icon: '🚫',
    suggestedName: 'Zero Alcohol Challenge',
    suggestedNameKey: 'zeroAlcohol.suggestedName',
    defaultRules: ['missingDaysPending'],
    availableRules: ['missingDaysPending']
  },
  DAILY_EXERCISE: {
    id: 'DAILY_EXERCISE',
    name: 'Daily Exercise Challenge',
    nameKey: 'dailyExercise.name',
    description: 'Build a habit of daily physical activity',
    descriptionKey: 'dailyExercise.description',
    icon: '💪',
    suggestedName: 'Daily Exercise Challenge',
    suggestedNameKey: 'dailyExercise.suggestedName',
    defaultRules: ['missingDaysPending'],
    availableRules: ['missingDaysPending']
  }
};

