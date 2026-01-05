'use client';

import React, { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { signUp } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LoginFormProps {
  returnUrl?: string;
  inviteCode?: string;
}

export function LoginForm({ returnUrl: propReturnUrl, inviteCode: propInviteCode }: LoginFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMismatch, setPasswordMismatch] = useState(false);
  
  // Get returnUrl or invite code from sessionStorage
  const getReturnInfo = () => {
    if (typeof window === 'undefined') return { returnUrl: null, inviteCode: null };
    
    const inviteCode = sessionStorage.getItem('pendingInviteCode');
    const returnUrl = sessionStorage.getItem('loginReturnUrl');
    
    return { returnUrl, inviteCode };
  };
  
  // Store invite code and returnUrl in sessionStorage on mount
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (propInviteCode) {
      sessionStorage.setItem('pendingInviteCode', propInviteCode);
    }
    
    if (propReturnUrl) {
      sessionStorage.setItem('loginReturnUrl', propReturnUrl);
    }
  }, [propReturnUrl, propInviteCode]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Custom validation with localized messages
    if (!email || email.trim() === '') {
      setError(t('emailRequired'));
      setPasswordMismatch(false);
      return;
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('emailInvalid'));
      setPasswordMismatch(false);
      return;
    }
    
    if (!password || password.trim() === '') {
      setError(t('passwordRequired'));
      setPasswordMismatch(false);
      return;
    }
    
    if (password.length < 6) {
      setError(t('passwordTooShort'));
      setPasswordMismatch(false);
      return;
    }
    
    if (isSignUp) {
      if (!confirmPassword || confirmPassword.trim() === '') {
        setError(t('confirmPasswordRequired'));
        setPasswordMismatch(false);
        return;
      }
      
      if (password !== confirmPassword) {
        setPasswordMismatch(true);
        setError(t('passwordMismatch'));
        return;
      }
    }
    
    const formData = new FormData(e.currentTarget);
    
    setLoading(true);
    setError(null);
    setPasswordMismatch(false);

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
          
          // Redirect based on onboarding status and returnUrl
          // Wait a bit for session cookies to be fully established before redirecting
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Get returnUrl or invite code from sessionStorage
          const { returnUrl: storedReturnUrl, inviteCode: storedInviteCode } = getReturnInfo();
          
          // Wait for session to be established
          await new Promise(resolve => setTimeout(resolve, 300));
          
          if (!userData?.hasCompletedOnboarding) {
            // If onboarding not completed, go to onboarding first
            // Keep pendingInviteCode in sessionStorage so OnboardingFlow can detect it
            if (storedReturnUrl) {
              sessionStorage.removeItem('loginReturnUrl');
            }
            window.location.href = `/${locale}/onboarding`;
          } else if (storedInviteCode) {
            // If invite code is present, redirect to join page
            sessionStorage.removeItem('pendingInviteCode');
            if (storedReturnUrl) {
              sessionStorage.removeItem('loginReturnUrl');
            }
            window.location.href = `/${locale}/join/${storedInviteCode}`;
          } else if (storedReturnUrl) {
            // If returnUrl is provided and onboarding is complete, redirect to it
            sessionStorage.removeItem('loginReturnUrl');
            window.location.href = storedReturnUrl;
          } else {
            // Default: redirect to dashboard
            window.location.href = `/${locale}/dashboard`;
          }
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
            type="text"
            autoComplete="email"
            disabled={isSubmitting}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) {
                setError(null);
              }
            }}
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
            disabled={isSubmitting}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordMismatch && e.target.value === confirmPassword) {
                setPasswordMismatch(false);
                setError(null);
              }
              if (error && e.target.value.trim() !== '') {
                setError(null);
              }
            }}
            className={`appearance-none rounded-none relative block w-full px-3 py-3 border ${passwordMismatch ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
            placeholder={t('password')}
          />
        </div>
        {isSignUp && (
          <div className="mt-3">
            <label htmlFor="confirmPassword" className="sr-only">
              {t('confirmPassword')}
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              disabled={isSubmitting}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (passwordMismatch && e.target.value === password) {
                  setPasswordMismatch(false);
                  setError(null);
                }
                if (error && e.target.value.trim() !== '') {
                  setError(null);
                }
              }}
              className={`appearance-none rounded-md relative block w-full px-3 py-3 border ${passwordMismatch ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'} placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
              placeholder={t('confirmPassword')}
            />
          </div>
        )}
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
              <span className="text-sm">{isSignUp ? t('creatingAccount') : t('signingIn')}</span>
            </div>
          ) : (
            isSignUp ? t('signup') : t('login')
          )}
        </button>
      </div>

      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setPasswordMismatch(false);
            setError(null);
          }}
          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {isSignUp ? t('alreadyHaveAccount') : t('dontHaveAccount')}
        </button>
      </div>
    </form>
  );
}

