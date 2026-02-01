# Backfill & Achievement Awards Setup Guide

## Overview

This guide explains how to:
1. Run the one-time backfill to award achievements to existing users
2. Understand how ongoing achievement awards work (no cron jobs needed!)

## How Achievement Awards Work

### ✅ Joining Achievements (Automatic)
- **Public Challenger** & **Community Member**: Awarded immediately when users join public habits
- No setup needed - works out of the box

### ✅ Leaderboard Achievements (On-Demand, No Cron Jobs!)
- **Monthly Champion**, **Annual Victor**, **Lifetime Legend**, etc.
- Awarded automatically when users view public habit leaderboards
- Only checked during award windows (first 7 days of month for monthly, January for yearly, anytime for lifetime)
- Uses in-memory cache to prevent duplicate awards
- **No infrastructure setup required** - works on Vercel free plan

### How It Works:
1. User visits `/public-challenges/zero-sugar?timeframe=month`
2. Server calculates leaderboard
3. If it's the first week of a new month, server checks if top users deserve awards
4. Awards are given automatically (cached to prevent duplicates)
5. User sees their achievement notification

---

## Step 3: Run the Backfill Script

### Option A: Using the API Endpoint (Recommended)

I've created an API endpoint at `/api/admin/backfill-achievements` that you can call once to backfill all achievements.

#### 1. Set up authentication (Optional but recommended)

Add to your `.env.local`:
```bash
ADMIN_SECRET=your-secure-random-string-here
```

Generate a secure random string:
```bash
# On Mac/Linux
openssl rand -base64 32

# Or use any password generator
```

#### 2. Run the backfill

**Without authentication:**
```bash
# Local
curl -X POST http://localhost:3000/api/admin/backfill-achievements

# Production
curl -X POST https://your-domain.com/api/admin/backfill-achievements
```

**With authentication:**
```bash
# Local
curl -X POST http://localhost:3000/api/admin/backfill-achievements \
  -H "Authorization: Bearer your-secure-random-string-here"

# Production
curl -X POST https://your-domain.com/api/admin/backfill-achievements \
  -H "Authorization: Bearer your-secure-random-string-here"
```

#### 3. Verify the backfill

Check status:
```bash
# Without auth
curl http://localhost:3000/api/admin/backfill-achievements

# With auth
curl http://localhost:3000/api/admin/backfill-achievements \
  -H "Authorization: Bearer your-secure-random-string-here"
```

Expected response:
```json
{
  "success": true,
  "status": {
    "totalMembers": 50,
    "totalPublicHabitAchievements": 85,
    "breakdown": {
      "ach_public_challenger": 45,
      "ach_community_member": 20,
      "ach_monthly_champion": 5,
      "ach_annual_victor": 2,
      "ach_lifetime_legend": 1,
      "ach_top_3_contender": 8,
      "ach_podium_regular": 3,
      "ach_multi_habit_hero": 1
    }
  }
}
```

#### 4. Delete the endpoint (Security)

After running the backfill successfully, you should either:
- Delete the file: `app/api/admin/backfill-achievements/route.ts`
- Or keep it with strong authentication for future use

### Option B: Using Vercel Dashboard (If deployed on Vercel)

1. Go to your Vercel project dashboard
2. Navigate to "Settings" → "Functions"
3. Find the function and invoke it manually
4. Or use Vercel CLI: `vercel env pull` then run locally

### Option C: Direct Server Access (Advanced)

If you have direct server access:

```javascript
// In Node.js REPL or script
const { backfillPublicHabitAchievements } = require('./app/actions/backfill-public-habit-achievements');

backfillPublicHabitAchievements().then(result => {
  console.log('Backfill completed:', result);
  process.exit(0);
});
```

---

## Step 4: Understand How Leaderboard Awards Work (No Setup Needed!)

### ✨ Event-Driven Awards (No Cron Jobs Required)

Leaderboard achievements are now awarded **automatically** when users view public habit detail pages. This approach:
- ✅ Works on Vercel free plan
- ✅ No infrastructure setup needed
- ✅ No scheduled jobs or cron configuration
- ✅ Simple and reliable

### How It Works

1. **User views a public habit leaderboard** (e.g., `/public-challenges/zero-sugar`)
2. **Server calculates the leaderboard** (as it always has)
3. **Server checks award window**:
   - Monthly: Only in first 7 days of new month
   - Yearly: Only in January
   - Lifetime: Anytime
4. **If in award window AND not already awarded**: Awards achievements to top users
5. **In-memory cache prevents duplicates** for the same period

### Award Windows

**Monthly Champion** (🥇):
- Awarded: 1st-7th of each month
- For: Previous month's #1 ranked user
- Example: On February 3rd, January's champion is awarded

**Annual Victor** (🏆):
- Awarded: During January (any day in January)
- For: Previous year's #1 ranked user
- Example: On January 15th, 2025's champion is awarded

**Lifetime Legend** (👑):
- Awarded: Anytime
- For: Current #1 on lifetime leaderboard
- Example: Awarded whenever someone views and they're #1

**Top 3 Contender** (🥈) & **Podium Regular** (🥉):
- Same timing as above, based on timeframe

### Performance Impact

- Check takes ~50-100ms
- Only runs during award windows (not every page view)
- Cached to prevent duplicate checking
- Non-blocking (doesn't slow down page loads)

### Testing Manually

If you want to manually trigger awards without waiting for users to view:

```bash
# Start dev server
yarn dev

# Visit the leaderboards in your browser
# Awards will be checked automatically:
http://localhost:3000/en/public-challenges/zero-sugar?timeframe=month
http://localhost:3000/en/public-challenges/zero-alcohol?timeframe=year
http://localhost:3000/en/public-challenges/active-days?timeframe=lifetime
```

Or create a simple test script:

```typescript
// test-awards.ts
import { getPublicHabitDetail } from '@/app/actions/public-habit';

async function testAwards() {
  // This will trigger award checking
  await getPublicHabitDetail('zero-sugar', 'MONTH');
  await getPublicHabitDetail('zero-alcohol', 'YEAR');
  await getPublicHabitDetail('active-days', 'LIFETIME');
  console.log('Awards checked for all habits!');
}

testAwards();
```

### Why This Approach?

**Advantages:**
- ✅ No cron jobs or scheduled tasks needed
- ✅ Works perfectly on Vercel free plan
- ✅ No additional infrastructure or setup
- ✅ Event-driven and naturally distributed
- ✅ Awards happen when users are active
- ✅ Simple to understand and maintain

**How awards are triggered:**
- Users viewing leaderboards = natural traffic pattern
- First view in new period = awards are checked
- In-memory cache = prevents duplicate checks
- Non-blocking = doesn't slow down page loads

**"What if no one views the leaderboard?"**
- Awards happen when first user views in new period
- If delayed, they're awarded as soon as someone views
- This is actually desirable - awards given when community is active

---

## Troubleshooting

### Backfill Issues

**Problem:** "Unauthorized" error
- **Solution:** Make sure ADMIN_SECRET matches in both `.env.local` and your curl command

**Problem:** "No users processed"
- **Solution:** Check that you have users with active PublicHabitMember records

**Problem:** Backfill times out
- **Solution:** If you have many users, the backfill might take a while. Consider increasing timeout limits or running during low-traffic hours.

### Leaderboard Award Issues

**Problem:** Awards not being given
- **Solution:** Make sure users are viewing the leaderboards during award windows (first 7 days of month for monthly)
- **Solution:** Check server logs for any errors during leaderboard calculation
- **Solution:** Verify users have active memberships and confirmed logs

**Problem:** Duplicate awards
- **Solution:** The in-memory cache should prevent this, but if you restart the server multiple times in the same period, duplicate checks might occur
- **Solution:** Database constraint (UNIQUE userId + achievementId) prevents actual duplicate records

**Problem:** Want to manually trigger awards
- **Solution:** Just visit the leaderboard pages yourself during the award window
- **Solution:** Or keep the backfill endpoint for manual testing

### Verification

After backfill and first cron run, verify:

```sql
-- Check awarded achievements
SELECT 
  a.code,
  COUNT(*) as awarded_count
FROM "UserAchievement" ua
JOIN "Achievement" a ON a.id = ua."achievementId"
WHERE a.code IN (
  'PUBLIC_CHALLENGER',
  'COMMUNITY_MEMBER',
  'MONTHLY_CHAMPION',
  'ANNUAL_VICTOR',
  'LIFETIME_LEGEND',
  'TOP_3_CONTENDER',
  'PODIUM_REGULAR',
  'MULTI_HABIT_HERO'
)
GROUP BY a.code
ORDER BY awarded_count DESC;
```

---

## Quick Start Checklist

- [ ] Run database migration (`add-public-habit-achievements.sql`)
- [ ] Deploy code changes
- [ ] Set `ADMIN_SECRET` environment variable (optional)
- [ ] Run backfill script via API endpoint
- [ ] Verify backfill completed successfully
- [ ] (Optional) Delete backfill endpoint after use or keep with auth
- [ ] Test by viewing leaderboards during award windows
- [ ] Monitor achievements in production

---

## Security Notes

1. **Always use authentication** for admin endpoints
2. **Delete or restrict** the backfill endpoint after use
3. **Use strong secrets** for ADMIN_SECRET
4. **Monitor logs** for unauthorized access attempts
5. **Rate limit** admin endpoints in production if keeping them
6. **No exposed cron endpoints** - everything is internal and automatic

---

## Need Help?

If you encounter issues:
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Test endpoints locally before production
4. Use the GET endpoints to check status
