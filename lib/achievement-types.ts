export type AchievementCategory = 'STREAK' | 'CONSISTENCY' | 'SOCIAL' | 'CHALLENGE';
export type AchievementTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'LEGENDARY';

export interface AchievementRequirement {
  type: 
    | 'streak' 
    | 'best_streak' 
    | 'consecutive_days'
    | 'total_confirmed_days' 
    | 'first_confirmation'
    | 'challenge_completed'
    | 'group_challenges_created'
    | 'group_challenges_joined'
    | 'join_large_challenge';
  value: number;
  challengeType?: string; // Optional filter by challenge type
}

export interface AchievementDefinition {
  id: string;
  code: string;
  category: AchievementCategory;
  tier: AchievementTier;
  name: string;
  nameKey: string; // i18n key
  description: string;
  descriptionKey: string; // i18n key
  iconEmoji: string;
  requirement: AchievementRequirement;
  order: number;
}

export interface UserAchievementData {
  id: string;
  userId: string;
  achievementId: string;
  challengeId?: string | null;
  earnedAt: Date;
  viewedAt?: Date | null;
  progress?: number | null;
  achievement?: AchievementDefinition;
}

// Tier styling configuration
export const TIER_STYLES: Record<AchievementTier, {
  bg: string;
  text: string;
  border: string;
  gradient?: string;
}> = {
  BRONZE: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-300 dark:border-orange-700',
  },
  SILVER: {
    bg: 'bg-gray-100 dark:bg-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
  },
  GOLD: {
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-400 dark:border-yellow-600',
  },
  PLATINUM: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-400 dark:border-purple-600',
  },
  LEGENDARY: {
    bg: 'bg-gradient-to-r from-pink-500 to-purple-600',
    text: 'text-white',
    border: 'border-pink-500',
    gradient: 'from-pink-500 to-purple-600',
  },
};

// Tier priority for determining the most valuable achievement
export const TIER_PRIORITY: Record<AchievementTier, number> = {
  LEGENDARY: 5,
  PLATINUM: 4,
  GOLD: 3,
  SILVER: 2,
  BRONZE: 1,
};

// Helper function to get the highest tier achievement from an array
export function getHighestTierAchievement<T extends { tier: AchievementTier }>(achievements: T[]): T {
  if (achievements.length === 0) {
    throw new Error('Cannot get highest tier from empty array');
  }
  return achievements.reduce((highest, current) => 
    TIER_PRIORITY[current.tier] > TIER_PRIORITY[highest.tier] ? current : highest
  );
}

// All achievement definitions
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Streak Milestones
  {
    id: 'ach_streak_3',
    code: 'STREAK_3_DAYS',
    category: 'STREAK',
    tier: 'BRONZE',
    name: 'Star',
    nameKey: 'achievements.badges.streak_3.name',
    description: 'Reach a 3-day streak',
    descriptionKey: 'achievements.badges.streak_3.description',
    iconEmoji: '🌟',
    requirement: { type: 'streak', value: 3 },
    order: 10,
  },
  {
    id: 'ach_streak_5',
    code: 'STREAK_5_DAYS',
    category: 'STREAK',
    tier: 'BRONZE',
    name: 'Superstar',
    nameKey: 'achievements.badges.streak_5.name',
    description: 'Reach a 5-day streak',
    descriptionKey: 'achievements.badges.streak_5.description',
    iconEmoji: '⭐',
    requirement: { type: 'streak', value: 5 },
    order: 20,
  },
  {
    id: 'ach_streak_7',
    code: 'STREAK_7_DAYS',
    category: 'STREAK',
    tier: 'SILVER',
    name: 'Champion',
    nameKey: 'achievements.badges.streak_7.name',
    description: 'Reach a 7-day streak',
    descriptionKey: 'achievements.badges.streak_7.description',
    iconEmoji: '🏆',
    requirement: { type: 'streak', value: 7 },
    order: 30,
  },
  {
    id: 'ach_streak_14',
    code: 'STREAK_14_DAYS',
    category: 'STREAK',
    tier: 'SILVER',
    name: 'Two Weeks Strong',
    nameKey: 'achievements.badges.streak_14.name',
    description: 'Reach a 14-day streak',
    descriptionKey: 'achievements.badges.streak_14.description',
    iconEmoji: '💪',
    requirement: { type: 'streak', value: 14 },
    order: 40,
  },
  {
    id: 'ach_streak_21',
    code: 'STREAK_21_DAYS',
    category: 'STREAK',
    tier: 'GOLD',
    name: 'Three Week Warrior',
    nameKey: 'achievements.badges.streak_21.name',
    description: 'Reach a 21-day streak',
    descriptionKey: 'achievements.badges.streak_21.description',
    iconEmoji: '⚡',
    requirement: { type: 'streak', value: 21 },
    order: 50,
  },
  {
    id: 'ach_streak_30',
    code: 'STREAK_30_DAYS',
    category: 'STREAK',
    tier: 'GOLD',
    name: 'Icon',
    nameKey: 'achievements.badges.streak_30.name',
    description: 'Reach a 30-day streak',
    descriptionKey: 'achievements.badges.streak_30.description',
    iconEmoji: '👑',
    requirement: { type: 'streak', value: 30 },
    order: 60,
  },
  {
    id: 'ach_streak_60',
    code: 'STREAK_60_DAYS',
    category: 'STREAK',
    tier: 'PLATINUM',
    name: 'Two Month Master',
    nameKey: 'achievements.badges.streak_60.name',
    description: 'Reach a 60-day streak',
    descriptionKey: 'achievements.badges.streak_60.description',
    iconEmoji: '💎',
    requirement: { type: 'streak', value: 60 },
    order: 70,
  },
  {
    id: 'ach_streak_90',
    code: 'STREAK_90_DAYS',
    category: 'STREAK',
    tier: 'PLATINUM',
    name: 'Quarter Year Hero',
    nameKey: 'achievements.badges.streak_90.name',
    description: 'Reach a 90-day streak',
    descriptionKey: 'achievements.badges.streak_90.description',
    iconEmoji: '🌠',
    requirement: { type: 'streak', value: 90 },
    order: 80,
  },
  {
    id: 'ach_streak_180',
    code: 'STREAK_180_DAYS',
    category: 'STREAK',
    tier: 'LEGENDARY',
    name: 'Half Year Legend',
    nameKey: 'achievements.badges.streak_180.name',
    description: 'Reach a 180-day streak',
    descriptionKey: 'achievements.badges.streak_180.description',
    iconEmoji: '🔥',
    requirement: { type: 'streak', value: 180 },
    order: 90,
  },
  {
    id: 'ach_streak_365',
    code: 'STREAK_365_DAYS',
    category: 'STREAK',
    tier: 'LEGENDARY',
    name: 'Year Champion',
    nameKey: 'achievements.badges.streak_365.name',
    description: 'Reach a 365-day streak',
    descriptionKey: 'achievements.badges.streak_365.description',
    iconEmoji: '🏅',
    requirement: { type: 'streak', value: 365 },
    order: 100,
  },

  // Best Streak Achievements
  {
    id: 'ach_best_streak_7',
    code: 'BEST_STREAK_7_DAYS',
    category: 'CONSISTENCY',
    tier: 'BRONZE',
    name: 'Best: Week',
    nameKey: 'achievements.badges.best_streak_7.name',
    description: 'Achieve a best streak of 7 days',
    descriptionKey: 'achievements.badges.best_streak_7.description',
    iconEmoji: '📈',
    requirement: { type: 'best_streak', value: 7 },
    order: 110,
  },
  {
    id: 'ach_best_streak_30',
    code: 'BEST_STREAK_30_DAYS',
    category: 'CONSISTENCY',
    tier: 'SILVER',
    name: 'Best: Month',
    nameKey: 'achievements.badges.best_streak_30.name',
    description: 'Achieve a best streak of 30 days',
    descriptionKey: 'achievements.badges.best_streak_30.description',
    iconEmoji: '📊',
    requirement: { type: 'best_streak', value: 30 },
    order: 120,
  },
  {
    id: 'ach_best_streak_90',
    code: 'BEST_STREAK_90_DAYS',
    category: 'CONSISTENCY',
    tier: 'GOLD',
    name: 'Best: Quarter',
    nameKey: 'achievements.badges.best_streak_90.name',
    description: 'Achieve a best streak of 90 days',
    descriptionKey: 'achievements.badges.best_streak_90.description',
    iconEmoji: '📉',
    requirement: { type: 'best_streak', value: 90 },
    order: 130,
  },
  {
    id: 'ach_best_streak_365',
    code: 'BEST_STREAK_365_DAYS',
    category: 'CONSISTENCY',
    tier: 'LEGENDARY',
    name: 'Best: Year',
    nameKey: 'achievements.badges.best_streak_365.name',
    description: 'Achieve a best streak of 365 days',
    descriptionKey: 'achievements.badges.best_streak_365.description',
    iconEmoji: '🎯',
    requirement: { type: 'best_streak', value: 365 },
    order: 140,
  },

  // Consistency Achievements
  {
    id: 'ach_perfect_week',
    code: 'PERFECT_WEEK',
    category: 'CONSISTENCY',
    tier: 'BRONZE',
    name: 'Perfect Week',
    nameKey: 'achievements.badges.perfect_week.name',
    description: 'Complete 7 consecutive days',
    descriptionKey: 'achievements.badges.perfect_week.description',
    iconEmoji: '📅',
    requirement: { type: 'consecutive_days', value: 7 },
    order: 150,
  },
  {
    id: 'ach_perfect_month',
    code: 'PERFECT_MONTH',
    category: 'CONSISTENCY',
    tier: 'GOLD',
    name: 'Perfect Month',
    nameKey: 'achievements.badges.perfect_month.name',
    description: 'Complete 30 consecutive days',
    descriptionKey: 'achievements.badges.perfect_month.description',
    iconEmoji: '📆',
    requirement: { type: 'consecutive_days', value: 30 },
    order: 160,
  },
  {
    id: 'ach_century_club',
    code: 'CENTURY_CLUB',
    category: 'CONSISTENCY',
    tier: 'PLATINUM',
    name: 'Century Club',
    nameKey: 'achievements.badges.century_club.name',
    description: 'Reach 100 total confirmed days',
    descriptionKey: 'achievements.badges.century_club.description',
    iconEmoji: '💯',
    requirement: { type: 'total_confirmed_days', value: 100 },
    order: 170,
  },
  {
    id: 'ach_500_club',
    code: '500_CLUB',
    category: 'CONSISTENCY',
    tier: 'LEGENDARY',
    name: '500 Club',
    nameKey: 'achievements.badges.500_club.name',
    description: 'Reach 500 total confirmed days',
    descriptionKey: 'achievements.badges.500_club.description',
    iconEmoji: '🎖️',
    requirement: { type: 'total_confirmed_days', value: 500 },
    order: 180,
  },

  // Challenge Achievements
  {
    id: 'ach_first_steps',
    code: 'FIRST_STEPS',
    category: 'CHALLENGE',
    tier: 'BRONZE',
    name: 'First Steps',
    nameKey: 'achievements.badges.first_steps.name',
    description: 'Complete your first day',
    descriptionKey: 'achievements.badges.first_steps.description',
    iconEmoji: '👣',
    requirement: { type: 'first_confirmation', value: 1 },
    order: 190,
  },
  {
    id: 'ach_challenge_complete',
    code: 'CHALLENGE_COMPLETE',
    category: 'CHALLENGE',
    tier: 'GOLD',
    name: 'Challenge Complete',
    nameKey: 'achievements.badges.challenge_complete.name',
    description: 'Finish a challenge with a due date',
    descriptionKey: 'achievements.badges.challenge_complete.description',
    iconEmoji: '✅',
    requirement: { type: 'challenge_completed', value: 1 },
    order: 200,
  },
  {
    id: 'ach_group_leader',
    code: 'GROUP_LEADER',
    category: 'CHALLENGE',
    tier: 'SILVER',
    name: 'Group Leader',
    nameKey: 'achievements.badges.group_leader.name',
    description: 'Create your first group challenge',
    descriptionKey: 'achievements.badges.group_leader.description',
    iconEmoji: '👥',
    requirement: { type: 'group_challenges_created', value: 1 },
    order: 210,
  },
  {
    id: 'ach_team_player',
    code: 'TEAM_PLAYER',
    category: 'CHALLENGE',
    tier: 'SILVER',
    name: 'Team Player',
    nameKey: 'achievements.badges.team_player.name',
    description: 'Join 3 group challenges',
    descriptionKey: 'achievements.badges.team_player.description',
    iconEmoji: '🤝',
    requirement: { type: 'group_challenges_joined', value: 3 },
    order: 220,
  },

  // Social Achievements
  {
    id: 'ach_active_community',
    code: 'ACTIVE_COMMUNITY',
    category: 'SOCIAL',
    tier: 'BRONZE',
    name: 'Active Community',
    nameKey: 'achievements.badges.active_community.name',
    description: 'Join a challenge with 5+ members',
    descriptionKey: 'achievements.badges.active_community.description',
    iconEmoji: '🌐',
    requirement: { type: 'join_large_challenge', value: 5 },
    order: 230,
  },
];

// Helper to get achievement by code
export const getAchievementByCode = (code: string): AchievementDefinition | undefined => {
  return ACHIEVEMENT_DEFINITIONS.find(a => a.code === code);
};

// Helper to get achievements by category
export const getAchievementsByCategory = (category: AchievementCategory): AchievementDefinition[] => {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.category === category).sort((a, b) => a.order - b.order);
};

// Helper to get achievements by tier
export const getAchievementsByTier = (tier: AchievementTier): AchievementDefinition[] => {
  return ACHIEVEMENT_DEFINITIONS.filter(a => a.tier === tier).sort((a, b) => a.order - b.order);
};
