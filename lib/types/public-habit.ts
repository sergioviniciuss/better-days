export interface PublicHabit {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  objectiveType: string;
  rules: string[];
  icon: string | null;
  isFeatured: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  score: number;
  currentStreak: number;
  achievementCount: number;
}

export interface PublicHabitListItem extends PublicHabit {
  participantCount: number;
  isUserMember?: boolean;
  topParticipants?: LeaderboardEntry[]; // Top 3 for preview
}

export type Timeframe = 'MONTH' | 'YEAR' | 'LIFETIME';

export interface PublicHabitDetail extends PublicHabit {
  participantCount: number;
  isUserMember?: boolean;
  leaderboard: LeaderboardEntry[];
  timeframe: Timeframe;
}
