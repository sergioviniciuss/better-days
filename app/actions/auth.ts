'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma/client';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const timezone = formData.get('timezone') as string || 'UTC';
  const preferredLanguage = formData.get('preferredLanguage') as string || 'en';

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  if (data.user) {
    // Create user record in database
    try {
      await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email!,
          timezone,
          preferredLanguage,
        },
      });
    } catch (dbError) {
      console.error('Error creating user:', dbError);
      return { error: 'Failed to create user profile' };
    }
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
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

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  return dbUser;
}

