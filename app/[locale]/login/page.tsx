import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/app/actions/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { cookies } from 'next/headers';
import { defaultLocale } from '@/lib/i18n/config';

export default async function LoginPage() {
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || defaultLocale;
  
  if (user) {
    redirect(`/${locale}/dashboard`);
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
        <LoginForm />
      </div>
    </div>
  );
}
