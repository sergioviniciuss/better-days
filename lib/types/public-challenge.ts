export interface PublicChallenge {
  id: string;
  name: string;
  description?: string;
  category: 'MONTHLY' | 'ANNUAL' | 'LIFETIME';
  objectiveType: string;
  startDate: string;
  dueDate?: string;
  participantCount: number;
  topParticipants: LeaderboardEntry[];
  isUserMember?: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  score: number;
}

export interface PublicChallengesData {
  monthly: PublicChallenge[];
  annual: PublicChallenge[];
  lifetime: PublicChallenge[];
}
