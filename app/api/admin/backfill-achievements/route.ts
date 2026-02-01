import { NextResponse } from 'next/server';
import { backfillPublicHabitAchievements, checkBackfillStatus } from '@/app/actions/backfill-public-habit-achievements';

/**
 * Backfill Public Habit Achievements
 * 
 * This endpoint runs the backfill script to award achievements to existing users.
 * 
 * IMPORTANT SECURITY NOTES:
 * 1. This endpoint should only be called ONCE after deploying the feature
 * 2. Add authentication or delete this file after running
 * 3. Consider using environment variable for basic auth
 * 
 * Usage:
 * POST http://localhost:3000/api/admin/backfill-achievements
 * 
 * Or with curl:
 * curl -X POST http://localhost:3000/api/admin/backfill-achievements
 */
export async function POST(request: Request) {
  // Optional: Add basic authentication
  const authHeader = request.headers.get('authorization');
  const expectedAuth = process.env.ADMIN_SECRET;
  
  // If ADMIN_SECRET is set, require authentication
  if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
    return NextResponse.json(
      { error: 'Unauthorized - Set ADMIN_SECRET env var or provide Bearer token' },
      { status: 401 }
    );
  }

  try {
    console.log('[Backfill API] Starting backfill process...');
    
    const result = await backfillPublicHabitAchievements();
    
    if (result.error) {
      console.error('[Backfill API] Error:', result.error);
      return NextResponse.json(
        { error: result.error, success: false },
        { status: 500 }
      );
    }
    
    console.log('[Backfill API] Backfill completed successfully:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Backfill completed successfully',
      stats: {
        usersProcessed: result.usersProcessed,
        errors: result.errors,
        leaderboardAchievements: result.leaderboardAchievements,
      },
    });
  } catch (error) {
    console.error('[Backfill API] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    );
  }
}

/**
 * Check backfill status
 * 
 * GET endpoint to check how many achievements have been awarded
 */
export async function GET(request: Request) {
  // Optional: Add basic authentication
  const authHeader = request.headers.get('authorization');
  const expectedAuth = process.env.ADMIN_SECRET;
  
  // If ADMIN_SECRET is set, require authentication
  if (expectedAuth && authHeader !== `Bearer ${expectedAuth}`) {
    return NextResponse.json(
      { error: 'Unauthorized - Set ADMIN_SECRET env var or provide Bearer token' },
      { status: 401 }
    );
  }

  try {
    const status = await checkBackfillStatus();
    
    if (status.error) {
      return NextResponse.json(
        { error: status.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('[Backfill Status] Exception:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
