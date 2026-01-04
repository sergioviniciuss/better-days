import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { cookies } from 'next/headers';
import { defaultLocale } from '@/lib/i18n/config';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnUrl?: string; invite?: string }>;
}) {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || defaultLocale;
  const resolvedSearchParams = await searchParams;
  const queryReturnUrl = resolvedSearchParams.returnUrl;
  const inviteCode = resolvedSearchParams.invite;
  
  // Get returnUrl from query param or cookie (cookie takes precedence as it's more reliable)
  const cookieReturnUrl = cookieStore.get('loginReturnUrl')?.value;
  const returnUrl = cookieReturnUrl || queryReturnUrl;
  
  if (user) {
    // Clear the cookie if it exists
    if (cookieReturnUrl) {
      cookieStore.delete('loginReturnUrl');
    }
    
    // If user is already logged in, check for invite code first
    if (inviteCode) {
      redirect(`/${locale}/join/${inviteCode}`);
    }
    
    // If user is already logged in and has a returnUrl, redirect there
    // Otherwise redirect to dashboard
    redirect(returnUrl || `/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Better Habits
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>
        <LoginForm returnUrl={returnUrl} inviteCode={inviteCode} />
      </div>
    </div>
  );
}
