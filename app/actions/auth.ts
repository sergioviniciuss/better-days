'use server';

import { cache as reactCache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Handle cache function - fallback to identity function if not available (e.g., in tests)
const cache = typeof reactCache === 'function' ? reactCache : <T extends (...args: any[]) => any>(fn: T) => fn;

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const timezone = formData.get('timezone') as string || 'UTC';
  const preferredLanguage = formData.get('preferredLanguage') as string || 'en';
  const locale = formData.get('locale') as string || 'en';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Create user record in database using service role key (bypasses RLS)
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any) {
            try {
              cookiesToSet.forEach(({ name, value, options }: any) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore
            }
          },
        },
      }
    );

    const { error: dbError } = await supabaseAdmin
      .from('User')
      .upsert({
        id: data.user.id,
        email: data.user.email!,
        timezone,
        preferredLanguage,
        createdAt: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (dbError) {
      console.error('Error creating user:', dbError);
      return { error: 'Failed to create user profile: ' + dbError.message };
    }
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log('[SignIn] Result:', {
    hasUser: !!data.user,
    userId: data.user?.id,
    hasSession: !!data.session,
    accessToken: data.session?.access_token?.substring(0, 20),
    error: error?.message,
  });

  if (error) {
    console.error('[SignIn] Auth error:', error);
    return { error: error.message };
  }

  if (!data.session) {
    console.error('[SignIn] No session returned');
    return { error: 'No session created' };
  }

  // Check if user profile exists, create it if not
  if (data.user) {
    const { data: existingUser } = await supabase
      .from('User')
      .select('id')
      .eq('id', data.user.id)
      .single();

    if (!existingUser) {
      // Create missing user profile using service role key
      const cookieStore = await cookies();
      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet: any) {
              try {
                cookiesToSet.forEach(({ name, value, options }: any) =>
                  cookieStore.set(name, value, options)
                );
              } catch {
                // Ignore
              }
            },
          },
        }
      );

      await supabaseAdmin.from('User').insert({
        id: data.user.id,
        email: data.user.email!,
        timezone: 'UTC',
        preferredLanguage: 'en',
        createdAt: new Date().toISOString(),
      });
    }
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

// Use React cache to deduplicate getCurrentUser calls within the same request
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user from database using Supabase client
  const { data: dbUser, error } = await supabase
    .from('User')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error('Error fetching user:', error);
    return null;
  }

  return dbUser;
});

