'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { signUp } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LoginForm() {
  const t = useTranslations('auth');
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47edcfc9-24b8-4790-8f1d-efb2fa213a1f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginForm.tsx:17',message:'Form submit started',data:{isSignUp,loadingBefore:loading},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    setLoading(true);
    setError(null);

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/47edcfc9-24b8-4790-8f1d-efb2fa213a1f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LoginForm.tsx:25',message:'Loading state set to true',data:{loadingAfter:true},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    try {
      if (isSignUp) {
        // Get timezone and locale
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const locale = localStorage.getItem('locale') || 'en';
        
        formData.append('timezone', timezone);
        formData.append('preferredLanguage', locale);
        
        const result = await signUp(formData);
        if (result?.error) {
          setError(result.error);
          setLoading(false);
          return;
        }
        
        // After signup, redirect to onboarding
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = `/${locale}/onboarding`;
      } else {
        // Use client-side Supabase for login (properly sets cookies)
        const supabase = createClient();
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }
        
        // Check if user has completed onboarding
        const locale = localStorage.getItem('locale') || 'en';
        
        if (data.user) {
          const { data: userData } = await supabase
            .from('User')
            .select('hasCompletedOnboarding')
            .eq('id', data.user.id)
            .single();
          
          // Redirect based on onboarding status
          startTransition(() => {
            if (userData?.hasCompletedOnboarding) {
              router.push(`/${locale}/dashboard`);
            } else {
              router.push(`/${locale}/onboarding`);
            }
            router.refresh();
          });
        }
      }
    } catch (err) {
      setError(t('loginError'));
      setLoading(false);
    }
  };

  const isSubmitting = loading || isPending;

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">
            {t('email')}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={t('email')}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            {t('password')}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
            disabled={isSubmitting}
            className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={t('password')}
            minLength={6}
          />
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
            </div>
          ) : (
            isSignUp ? t('signup') : t('login')
          )}
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isSignUp ? t('alreadyHaveAccount') : t('dontHaveAccount')}
        </button>
      </div>
    </form>
  );
}

