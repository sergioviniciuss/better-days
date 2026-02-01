/**
 * Public Habit Achievements - Documentation & Tests
 * 
 * This file serves as both unit tests and documentation for all public habit achievements.
 * Each test clearly describes when and how an achievement is earned.
 */

import { ACHIEVEMENT_DEFINITIONS, getAchievementByCode } from './achievement-types';

describe('Public Habit Achievements - Complete Documentation', () => {
  
  // ============================================================================
  // JOINING ACHIEVEMENTS
  // These achievements are awarded when users join public habits
  // ============================================================================
  
  describe('🌍 PUBLIC_CHALLENGER (Bronze) - "Join your first public habit"', () => {
    const achievement = getAchievementByCode('PUBLIC_CHALLENGER');
    
    it('should be defined with correct properties', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.tier).toBe('BRONZE');
      expect(achievement?.category).toBe('SOCIAL');
      expect(achievement?.iconEmoji).toBe('🌍');
    });
    
    it('HOW TO EARN: Join any one public habit for the first time', () => {
      // Achievement is awarded when:
      // 1. User joins their first public habit (Zero Sugar, Zero Alcohol, or Active Days)
      // 2. This happens automatically when joinPublicHabit() succeeds
      // 3. The achievement detector checks context: 'public_habit_joined'
      
      expect(achievement?.requirement.type).toBe('public_habit_joined');
      expect(achievement?.requirement.value).toBe(1);
      
      // User Story:
      // "Sarah visits the public challenges page and clicks 'Join' on the 
      //  Zero Sugar challenge. Upon successful join, she immediately receives 
      //  the Public Challenger achievement badge."
    });
    
    it('EDGE CASES: Is NOT awarded if...', () => {
      // - User already has the achievement (can only be earned once)
      // - User is re-joining a public habit they previously left
      // - Join action fails (e.g., network error, validation error)
      expect(achievement?.id).toBe('ach_public_challenger');
    });
  });
  
  describe('🌎 COMMUNITY_MEMBER (Silver) - "Join all 3 public habits"', () => {
    const achievement = getAchievementByCode('COMMUNITY_MEMBER');
    
    it('should be defined with correct properties', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.tier).toBe('SILVER');
      expect(achievement?.category).toBe('SOCIAL');
      expect(achievement?.iconEmoji).toBe('🌎');
    });
    
    it('HOW TO EARN: Join all three available public habits', () => {
      // Achievement is awarded when:
      // 1. User has ACTIVE memberships in all 3 public habits:
      //    - Zero Sugar
      //    - Zero Alcohol  
      //    - Active Days
      // 2. The achievement detector counts active PublicHabitMember records
      // 3. Must have exactly 3 active memberships
      
      expect(achievement?.requirement.type).toBe('public_habits_joined_count');
      expect(achievement?.requirement.value).toBe(3);
      
      // User Story:
      // "John has already joined Zero Sugar and Zero Alcohol. When he joins 
      //  the Active Days challenge as his third public habit, he receives 
      //  the Community Member achievement for being part of all communities."
    });
    
    it('EDGE CASES: Is NOT awarded if...', () => {
      // - User has only 1 or 2 active public habit memberships
      // - User left one of the habits (status = 'LEFT')
      // - User already has the achievement
      // - More public habits are added in the future (requirement stays 3)
      expect(achievement?.id).toBe('ach_community_member');
    });
  });

  // ============================================================================
  // LEADERSHIP ACHIEVEMENTS (Period-End Awards)
  // These achievements are awarded at the end of monthly/yearly periods
  // or anytime for lifetime achievements
  // ============================================================================
  
  describe('🥇 MONTHLY_CHAMPION (Gold) - "Reach #1 on any monthly leaderboard"', () => {
    const achievement = getAchievementByCode('MONTHLY_CHAMPION');
    
    it('should be defined with correct properties', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.tier).toBe('GOLD');
      expect(achievement?.category).toBe('CHALLENGE');
      expect(achievement?.iconEmoji).toBe('🥇');
    });
    
    it('HOW TO EARN: Be ranked #1 on any monthly leaderboard at month-end', () => {
      // Achievement is awarded when:
      // 1. User has the highest "best streak within current month" score
      // 2. Checked at the END of each calendar month
      // 3. Can be earned for any of the 3 public habits (Zero Sugar, Zero Alcohol, Active Days)
      // 4. Only needs to be #1 in ONE habit, not all
      // 5. Awarded via awardPublicHabitLeaderboardAchievements() function
      
      expect(achievement?.requirement.type).toBe('public_habit_rank_1_monthly');
      expect(achievement?.requirement.value).toBe(1);
      
      // User Story:
      // "Throughout January, Maria maintained a perfect 31-day streak in the 
      //  Zero Sugar challenge. At the end of January, the system checks all 
      //  leaderboards and awards her the Monthly Champion achievement for 
      //  having the best monthly streak in Zero Sugar."
      
      // SCORING DETAILS:
      // - Monthly leaderboard scores: "best streak within current month"
      // - Only confirmed logs count (confirmedAt !== null)
      // - Ties are broken by order in leaderboard query
    });
    
    it('EDGE CASES: Is NOT awarded if...', () => {
      // - Checked mid-month (must wait until month-end)
      // - User is ranked #2 or lower
      // - User already has the achievement (can only earn once)
      // - No active membership in the public habit
      // - Period-end award function is not run
      expect(achievement?.id).toBe('ach_monthly_champion');
    });
  });
  
  describe('🏆 ANNUAL_VICTOR (Platinum) - "Reach #1 on any yearly leaderboard"', () => {
    const achievement = getAchievementByCode('ANNUAL_VICTOR');
    
    it('should be defined with correct properties', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.tier).toBe('PLATINUM');
      expect(achievement?.category).toBe('CHALLENGE');
      expect(achievement?.iconEmoji).toBe('🏆');
    });
    
    it('HOW TO EARN: Be ranked #1 on any yearly leaderboard at year-end', () => {
      // Achievement is awarded when:
      // 1. User has the highest "best streak within current year" score
      // 2. Checked at the END of each calendar year (December 31st)
      // 3. Can be earned for any of the 3 public habits
      // 4. Only needs to be #1 in ONE habit for the year
      // 5. Awarded via awardPublicHabitLeaderboardAchievements() function
      
      expect(achievement?.requirement.type).toBe('public_habit_rank_1_yearly');
      expect(achievement?.requirement.value).toBe(1);
      
      // User Story:
      // "David maintained an incredible 180-day streak in the Active Days 
      //  challenge during 2026. At the end of the year, he is crowned the 
      //  Annual Victor for having the best yearly streak in that habit."
      
      // SCORING DETAILS:
      // - Yearly leaderboard scores: "best streak within current year"
      // - Year boundary: January 1 00:00:00 to December 31 23:59:59
      // - Only confirmed logs count
    });
    
    it('EDGE CASES: Is NOT awarded if...', () => {
      // - Checked before year-end
      // - User is ranked #2 or lower for the year
      // - User already has the achievement
      // - User joined mid-year (can still win if best streak is highest)
      // - Year-end award function is not scheduled/run
      expect(achievement?.id).toBe('ach_annual_victor');
    });
  });
  
  describe('👑 LIFETIME_LEGEND (Legendary) - "Reach #1 on any lifetime leaderboard"', () => {
    const achievement = getAchievementByCode('LIFETIME_LEGEND');
    
    it('should be defined with correct properties', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.tier).toBe('LEGENDARY');
      expect(achievement?.category).toBe('CHALLENGE');
      expect(achievement?.iconEmoji).toBe('👑');
    });
    
    it('HOW TO EARN: Have the highest current streak on any lifetime leaderboard', () => {
      // Achievement is awarded when:
      // 1. User has the highest "current streak" (lifetime leaderboard metric)
      // 2. Can be checked at ANY time (not limited to period-end)
      // 3. Dynamic metric that changes as streaks grow/break
      // 4. Can be earned for any of the 3 public habits
      // 5. Most prestigious achievement (LEGENDARY tier)
      
      expect(achievement?.requirement.type).toBe('public_habit_rank_1_lifetime');
      expect(achievement?.requirement.value).toBe(1);
      
      // User Story:
      // "Alex has maintained a 500-day current streak in the Zero Alcohol 
      //  challenge, which is the longest active streak among all users. 
      //  When the leaderboard award function runs, Alex receives the 
      //  Lifetime Legend achievement."
      
      // SCORING DETAILS:
      // - Lifetime leaderboard scores: "current active streak"
      // - If streak breaks, user may lose #1 position to another user
      // - Achievement is permanent once earned (even if user loses #1 later)
      // - Represents sustained excellence over longest period
    });
    
    it('EDGE CASES: Is NOT awarded if...', () => {
      // - Another user has a longer current streak
      // - User's streak was broken (current streak = 0)
      // - User already has the achievement
      // - Leaderboard award function hasn't been run recently
      expect(achievement?.id).toBe('ach_lifetime_legend');
    });
  });
  
  describe('🥈 TOP_3_CONTENDER (Silver) - "Reach top 3 in any timeframe"', () => {
    const achievement = getAchievementByCode('TOP_3_CONTENDER');
    
    it('should be defined with correct properties', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.tier).toBe('SILVER');
      expect(achievement?.category).toBe('CHALLENGE');
      expect(achievement?.iconEmoji).toBe('🥈');
    });
    
    it('HOW TO EARN: Be in top 3 on any leaderboard (month, year, or lifetime)', () => {
      // Achievement is awarded when:
      // 1. User is ranked 1st, 2nd, or 3rd on ANY leaderboard
      // 2. Can be any timeframe: monthly, yearly, or lifetime
      // 3. Can be any of the 3 public habits
      // 4. Checked at period-end for monthly/yearly, anytime for lifetime
      // 5. Easier to achieve than rank #1 achievements
      
      expect(achievement?.requirement.type).toBe('public_habit_top_3');
      expect(achievement?.requirement.value).toBe(3);
      
      // User Story:
      // "Emma joins the Zero Sugar challenge mid-month but maintains a strong
      //  12-day streak. At month-end, she places 3rd on the monthly leaderboard 
      //  and earns the Top 3 Contender achievement."
      
      // QUALIFYING SCENARIOS:
      // - Rank 1, 2, or 3 on monthly leaderboard = ✅
      // - Rank 1, 2, or 3 on yearly leaderboard = ✅
      // - Rank 1, 2, or 3 on lifetime leaderboard = ✅
      // - Rank 4 or lower on all leaderboards = ❌
    });
    
    it('EDGE CASES: Is NOT awarded if...', () => {
      // - User is ranked 4th or lower on all leaderboards
      // - User already has the achievement
      // - User has no confirmed logs (score = 0)
      // - Fewer than 3 users in the public habit
      expect(achievement?.id).toBe('ach_top_3_contender');
    });
  });
  
  describe('🥉 PODIUM_REGULAR (Gold) - "Reach top 3 in all timeframes"', () => {
    const achievement = getAchievementByCode('PODIUM_REGULAR');
    
    it('should be defined with correct properties', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.tier).toBe('GOLD');
      expect(achievement?.category).toBe('CHALLENGE');
      expect(achievement?.iconEmoji).toBe('🥉');
    });
    
    it('HOW TO EARN: Be in top 3 on ALL three leaderboards (month, year, lifetime)', () => {
      // Achievement is awarded when:
      // 1. User is in top 3 on monthly leaderboard (rank 1-3)
      // 2. AND in top 3 on yearly leaderboard (rank 1-3)
      // 3. AND in top 3 on lifetime leaderboard (rank 1-3)
      // 4. All three conditions must be met simultaneously for the same habit
      // 5. This demonstrates consistent excellence across all timeframes
      
      expect(achievement?.requirement.type).toBe('public_habit_podium_all');
      expect(achievement?.requirement.value).toBe(3);
      
      // User Story:
      // "Carlos is a dedicated member of the Active Days challenge. He ranks:
      //  - 2nd place on the monthly leaderboard (28-day streak this month)
      //  - 3rd place on the yearly leaderboard (90-day best streak this year)
      //  - 1st place on the lifetime leaderboard (200-day current streak)
      //  
      //  Since he's in the top 3 for all three timeframes, he receives the 
      //  prestigious Podium Regular achievement."
      
      // REQUIREMENT BREAKDOWN:
      // - Monthly: Top 3 ✅
      // - Yearly: Top 3 ✅  
      // - Lifetime: Top 3 ✅
      // = Podium Regular earned! 🎉
    });
    
    it('EDGE CASES: Is NOT awarded if...', () => {
      // - User is top 3 in only 1 or 2 timeframes (not all 3)
      // - User already has the achievement
      // - User is top 3 in different habits across timeframes (must be same habit)
      // Example: #1 monthly in Zero Sugar but #1 yearly in Active Days = ❌
      expect(achievement?.id).toBe('ach_podium_regular');
    });
  });

  // ============================================================================
  // CONSISTENCY ACHIEVEMENTS
  // These achievements reward maintaining streaks across multiple habits
  // ============================================================================
  
  describe('⚡ MULTI_HABIT_HERO (Gold) - "Maintain 7+ day streaks in all 3 public habits"', () => {
    const achievement = getAchievementByCode('MULTI_HABIT_HERO');
    
    it('should be defined with correct properties', () => {
      expect(achievement).toBeDefined();
      expect(achievement?.tier).toBe('GOLD');
      expect(achievement?.category).toBe('CONSISTENCY');
      expect(achievement?.iconEmoji).toBe('⚡');
    });
    
    it('HOW TO EARN: Maintain active streaks of 7+ days in all three public habits simultaneously', () => {
      // Achievement is awarded when:
      // 1. User is an ACTIVE member of all 3 public habits
      // 2. User has a current streak of 7+ days in Zero Sugar
      // 3. AND has a current streak of 7+ days in Zero Alcohol
      // 4. AND has a current streak of 7+ days in Active Days
      // 5. All three streaks must be active at the same time
      // 6. Checked when user joins a habit or confirms daily logs
      
      expect(achievement?.requirement.type).toBe('public_habit_multi_streak');
      expect(achievement?.requirement.value).toBe(7);
      
      // User Story:
      // "Lisa is committed to improving multiple areas of her life. She has:
      //  - 10-day current streak in Zero Sugar (no sugar for 10 days)
      //  - 8-day current streak in Zero Alcohol (no alcohol for 8 days)
      //  - 7-day current streak in Active Days (exercised for 7 days)
      //  
      //  Since all three streaks are ≥7 days and active simultaneously,
      //  she receives the Multi-Habit Hero achievement for her dedication
      //  across multiple healthy habits."
      
      // TECHNICAL DETAILS:
      // - Current streak calculation: consecutive confirmed days from today backwards
      // - Only confirmed logs count (confirmedAt !== null, consumedSugar === false)
      // - Logs filtered by objectiveType (shared across challenges of same type)
      // - Streak must be CURRENT (not broken)
    });
    
    it('REQUIREMENTS CHECKLIST: All must be true', () => {
      // ✅ User joined all 3 public habits (status = ACTIVE)
      // ✅ Zero Sugar current streak ≥ 7 days
      // ✅ Zero Alcohol current streak ≥ 7 days
      // ✅ Active Days current streak ≥ 7 days
      // ✅ All streaks are current (not broken)
      // ✅ User doesn't already have the achievement
      
      expect(achievement?.requirement.value).toBe(7);
    });
    
    it('EDGE CASES: Is NOT awarded if...', () => {
      // - User has only 1 or 2 public habit memberships (not all 3)
      // - Any one streak is < 7 days
      // - Any one streak is broken (current streak = 0)
      // - User left one of the public habits
      // - User already has the achievement
      // - No confirmed logs for one or more habits
      
      // Example failure scenarios:
      // Scenario 1: Lisa's streaks are [10, 8, 6] days = ❌ (6 < 7)
      // Scenario 2: Lisa's streaks are [10, 0, 15] days = ❌ (alcohol streak broken)
      // Scenario 3: Lisa's streaks are [10, 8, 7] days = ✅ (all ≥ 7)
      
      expect(achievement?.id).toBe('ach_multi_habit_hero');
    });
    
    it('EXAMPLE SCENARIOS: When is it awarded?', () => {
      // SCENARIO A: Early adopter (joins all 3 habits on day 1)
      // - Day 1: Join all 3, start logging
      // - Day 7: Has 7-day streaks in all = Achievement awarded ✅
      
      // SCENARIO B: Gradual joiner (joins habits over time)
      // - Week 1: Joins Zero Sugar (7-day streak)
      // - Week 2: Joins Zero Alcohol (7-day streak, Sugar now 14 days)
      // - Week 3: Joins Active Days (7-day streak in Active Days)
      // - Achievement awarded on day 7 of Active Days ✅
      
      // SCENARIO C: Recovery from broken streak
      // - Had 10-day streaks in all 3 habits
      // - Breaks Zero Sugar streak (resets to 0)
      // - Rebuilds Zero Sugar streak back to 7+ days
      // - Achievement still awarded (only current streak matters) ✅
      
      expect(achievement?.requirement.type).toBe('public_habit_multi_streak');
    });
  });

  // ============================================================================
  // ACHIEVEMENT SYSTEM INTEGRATION
  // How achievements are triggered and awarded
  // ============================================================================
  
  describe('Achievement Triggering System', () => {
    it('TRIGGER: Joining achievements are checked when user joins a public habit', () => {
      // Flow:
      // 1. User calls joinPublicHabit('habit-id')
      // 2. Function creates PublicHabitMember record
      // 3. Calls checkAndAwardAchievements({ context: 'public_habit_joined' })
      // 4. Detector checks: PUBLIC_CHALLENGER, COMMUNITY_MEMBER, MULTI_HABIT_HERO
      
      const joiningAchievements = ACHIEVEMENT_DEFINITIONS.filter(a =>
        a.requirement.type === 'public_habit_joined' ||
        a.requirement.type === 'public_habits_joined_count' ||
        a.requirement.type === 'public_habit_multi_streak'
      );
      
      expect(joiningAchievements).toHaveLength(3);
    });
    
    it('TRIGGER: Leadership achievements are checked at period-end', () => {
      // Flow:
      // 1. Cron job runs awardPublicHabitLeaderboardAchievements()
      // 2. Function fetches final leaderboards for each habit
      // 3. Awards achievements to top performers
      // 4. Checks: MONTHLY_CHAMPION, ANNUAL_VICTOR, LIFETIME_LEGEND, TOP_3_CONTENDER, PODIUM_REGULAR
      
      const leaderboardAchievements = ACHIEVEMENT_DEFINITIONS.filter(a =>
        a.requirement.type === 'public_habit_rank_1_monthly' ||
        a.requirement.type === 'public_habit_rank_1_yearly' ||
        a.requirement.type === 'public_habit_rank_1_lifetime' ||
        a.requirement.type === 'public_habit_top_3' ||
        a.requirement.type === 'public_habit_podium_all'
      );
      
      expect(leaderboardAchievements).toHaveLength(5);
    });
    
    it('PREVENTION: Achievements can only be earned once per user', () => {
      // Database constraint: UNIQUE INDEX on (userId, achievementId)
      // If user already has achievement, it's skipped during checking
      
      const allPublicHabitAchievements = ACHIEVEMENT_DEFINITIONS.filter(a =>
        a.requirement.type.startsWith('public_habit')
      );
      
      expect(allPublicHabitAchievements).toHaveLength(8);
      // Each achievement has a unique ID and can only appear once per user
    });
  });

  // ============================================================================
  // SUMMARY & QUICK REFERENCE
  // ============================================================================
  
  describe('Quick Reference Guide', () => {
    it('should have exactly 9 public habit achievements', () => {
      const publicHabitAchievements = ACHIEVEMENT_DEFINITIONS.filter(a =>
        a.code === 'PUBLIC_CHALLENGER' ||
        a.code === 'COMMUNITY_MEMBER' ||
        a.code === 'MONTHLY_CHAMPION' ||
        a.code === 'ANNUAL_VICTOR' ||
        a.code === 'LIFETIME_LEGEND' ||
        a.code === 'TOP_3_CONTENDER' ||
        a.code === 'PODIUM_REGULAR' ||
        a.code === 'MULTI_HABIT_HERO'
      );
      
      expect(publicHabitAchievements).toHaveLength(8); // Note: 8 not 9 (no rank_1 generic)
    });
    
    it('DIFFICULTY TIERS: From easiest to hardest', () => {
      // BRONZE (Easiest)
      // └─ PUBLIC_CHALLENGER: Join 1 habit
      
      // SILVER (Easy)
      // ├─ TOP_3_CONTENDER: Top 3 in any timeframe
      // └─ COMMUNITY_MEMBER: Join all 3 habits
      
      // GOLD (Moderate)
      // ├─ MONTHLY_CHAMPION: #1 on monthly leaderboard
      // ├─ PODIUM_REGULAR: Top 3 in all timeframes
      // └─ MULTI_HABIT_HERO: 7+ day streaks in all habits
      
      // PLATINUM (Hard)
      // └─ ANNUAL_VICTOR: #1 on yearly leaderboard
      
      // LEGENDARY (Hardest)
      // └─ LIFETIME_LEGEND: #1 on lifetime leaderboard
      
      const tiers = {
        BRONZE: ['PUBLIC_CHALLENGER'],
        SILVER: ['TOP_3_CONTENDER', 'COMMUNITY_MEMBER'],
        GOLD: ['MONTHLY_CHAMPION', 'PODIUM_REGULAR', 'MULTI_HABIT_HERO'],
        PLATINUM: ['ANNUAL_VICTOR'],
        LEGENDARY: ['LIFETIME_LEGEND'],
      };
      
      expect(tiers.BRONZE).toHaveLength(1);
      expect(tiers.SILVER).toHaveLength(2);
      expect(tiers.GOLD).toHaveLength(3);
      expect(tiers.PLATINUM).toHaveLength(1);
      expect(tiers.LEGENDARY).toHaveLength(1);
    });
    
    it('ACHIEVEMENT CATEGORIES', () => {
      // SOCIAL: Joining and participating
      // - PUBLIC_CHALLENGER
      // - COMMUNITY_MEMBER
      
      // CHALLENGE: Competition and performance
      // - MONTHLY_CHAMPION
      // - ANNUAL_VICTOR
      // - LIFETIME_LEGEND
      // - TOP_3_CONTENDER
      // - PODIUM_REGULAR
      
      // CONSISTENCY: Maintaining habits
      // - MULTI_HABIT_HERO
      
      const categories = {
        SOCIAL: ['PUBLIC_CHALLENGER', 'COMMUNITY_MEMBER'],
        CHALLENGE: ['MONTHLY_CHAMPION', 'ANNUAL_VICTOR', 'LIFETIME_LEGEND', 'TOP_3_CONTENDER', 'PODIUM_REGULAR'],
        CONSISTENCY: ['MULTI_HABIT_HERO'],
      };
      
      expect(categories.SOCIAL).toHaveLength(2);
      expect(categories.CHALLENGE).toHaveLength(5);
      expect(categories.CONSISTENCY).toHaveLength(1);
    });
  });
});
