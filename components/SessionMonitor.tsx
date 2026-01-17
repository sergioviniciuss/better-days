'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { isSessionExpired, clearSessionMetadata } from '@/lib/session-storage';
import { createClient } from '@/lib/supabase/client';

/**
 * Client-side session monitor that checks for custom session expiry
 * and logs out the user if the session has exceeded its allowed duration
 */
export const SessionMonitor = () => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check session expiry every minute
    const checkSession = async () => {
      if (isSessionExpired()) {
        // Session has expired based on our custom duration
        const supabase = createClient();
        
        try {
          // Sign out from Supabase first
          await supabase.auth.signOut();
          
          // Only clear metadata after successful sign out
          clearSessionMetadata();
          
          // Extract locale from pathname
          const pathParts = pathname.split('/').filter(Boolean);
          const locale = ['en', 'pt-BR'].includes(pathParts[0]) ? pathParts[0] : 'en';
          
          // Redirect to login
          window.location.href = `/${locale}/login`;
        } catch (error) {
          // If sign out fails, keep metadata intact so session expiry checks continue
          console.error('Failed to sign out expired session:', error);
        }
      }
    };

    // Check immediately on mount
    checkSession();

    // Set up interval to check every minute
    const interval = setInterval(checkSession, 60 * 1000);

    return () => clearInterval(interval);
  }, [pathname, router]);

  // This component doesn't render anything
  return null;
};
