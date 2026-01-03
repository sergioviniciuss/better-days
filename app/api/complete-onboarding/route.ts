import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/app/actions/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = await createClient();
    
    const { error } = await supabase
      .from('User')
      .update({ hasCompletedOnboarding: true })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating onboarding status:', error);
      return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in complete-onboarding:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

