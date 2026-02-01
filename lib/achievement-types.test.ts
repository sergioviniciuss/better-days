import { 
  ACHIEVEMENT_DEFINITIONS, 
  getAchievementByCode, 
  getAchievementsByCategory,
  getAchievementsByTier,
  TIER_STYLES 
} from './achievement-types';

describe('Achievement Types', () => {
  describe('ACHIEVEMENT_DEFINITIONS', () => {
    it('should have all required achievement definitions', () => {
      expect(ACHIEVEMENT_DEFINITIONS).toBeDefined();
      expect(ACHIEVEMENT_DEFINITIONS.length).toBeGreaterThan(0);
    });

    it('should have valid structure for each achievement', () => {
      ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
        expect(achievement).toHaveProperty('id');
        expect(achievement).toHaveProperty('code');
        expect(achievement).toHaveProperty('category');
        expect(achievement).toHaveProperty('tier');
        expect(achievement).toHaveProperty('name');
        expect(achievement).toHaveProperty('nameKey');
        expect(achievement).toHaveProperty('description');
        expect(achievement).toHaveProperty('descriptionKey');
        expect(achievement).toHaveProperty('iconEmoji');
        expect(achievement).toHaveProperty('requirement');
        expect(achievement).toHaveProperty('order');
      });
    });

    it('should have unique IDs', () => {
      const ids = ACHIEVEMENT_DEFINITIONS.map(a => a.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it('should have unique codes', () => {
      const codes = ACHIEVEMENT_DEFINITIONS.map(a => a.code);
      const uniqueCodes = new Set(codes);
      expect(codes.length).toBe(uniqueCodes.size);
    });
  });

  describe('getAchievementByCode', () => {
    it('should return achievement by valid code', () => {
      const achievement = getAchievementByCode('STREAK_3_DAYS');
      expect(achievement).toBeDefined();
      expect(achievement?.code).toBe('STREAK_3_DAYS');
    });

    it('should return undefined for invalid code', () => {
      const achievement = getAchievementByCode('INVALID_CODE');
      expect(achievement).toBeUndefined();
    });
  });

  describe('getAchievementsByCategory', () => {
    it('should return achievements for STREAK category', () => {
      const achievements = getAchievementsByCategory('STREAK');
      expect(achievements.length).toBeGreaterThan(0);
      achievements.forEach(a => {
        expect(a.category).toBe('STREAK');
      });
    });

    it('should return achievements sorted by order', () => {
      const achievements = getAchievementsByCategory('STREAK');
      for (let i = 1; i < achievements.length; i++) {
        expect(achievements[i].order).toBeGreaterThanOrEqual(achievements[i - 1].order);
      }
    });

    it('should return empty array for invalid category', () => {
      const achievements = getAchievementsByCategory('INVALID' as any);
      expect(achievements).toEqual([]);
    });
  });

  describe('getAchievementsByTier', () => {
    it('should return achievements for BRONZE tier', () => {
      const achievements = getAchievementsByTier('BRONZE');
      expect(achievements.length).toBeGreaterThan(0);
      achievements.forEach(a => {
        expect(a.tier).toBe('BRONZE');
      });
    });

    it('should return achievements sorted by order', () => {
      const achievements = getAchievementsByTier('GOLD');
      for (let i = 1; i < achievements.length; i++) {
        expect(achievements[i].order).toBeGreaterThanOrEqual(achievements[i - 1].order);
      }
    });
  });

  describe('TIER_STYLES', () => {
    it('should have styles for all tiers', () => {
      expect(TIER_STYLES.BRONZE).toBeDefined();
      expect(TIER_STYLES.SILVER).toBeDefined();
      expect(TIER_STYLES.GOLD).toBeDefined();
      expect(TIER_STYLES.PLATINUM).toBeDefined();
      expect(TIER_STYLES.LEGENDARY).toBeDefined();
    });

    it('should have required style properties', () => {
      Object.values(TIER_STYLES).forEach(style => {
        expect(style).toHaveProperty('bg');
        expect(style).toHaveProperty('text');
        expect(style).toHaveProperty('border');
      });
    });
  });

  describe('Achievement Requirements', () => {
    it('should have valid requirement types', () => {
      const validTypes = [
        'streak',
        'best_streak',
        'consecutive_days',
        'total_confirmed_days',
        'first_confirmation',
        'challenge_completed',
        'group_challenges_created',
        'group_challenges_joined',
        'join_large_challenge',
        'public_habit_joined',
        'public_habits_joined_count',
        'public_habit_rank_1_monthly',
        'public_habit_rank_1_yearly',
        'public_habit_rank_1_lifetime',
        'public_habit_top_3',
        'public_habit_podium_all',
        'public_habit_multi_streak',
      ];

      ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
        expect(validTypes).toContain(achievement.requirement.type);
        expect(achievement.requirement.value).toBeGreaterThanOrEqual(1);
      });
    });

    it('should have streak achievements in ascending order', () => {
      const streakAchievements = getAchievementsByCategory('STREAK')
        .filter(a => a.requirement.type === 'streak');
      
      for (let i = 1; i < streakAchievements.length; i++) {
        expect(streakAchievements[i].requirement.value)
          .toBeGreaterThan(streakAchievements[i - 1].requirement.value);
      }
    });
  });
});
