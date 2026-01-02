import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from './lib/i18n/config';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export async function middleware(request: NextRequest) {
  // Handle Supabase auth first
  const authResponse = await updateSession(request);
  
  // Apply i18n middleware
  const intlResponse = intlMiddleware(request);
  
  // Merge responses - use auth response as base
  const response = authResponse;
  
  // Copy i18n response headers and cookies
  intlResponse.headers.forEach((value, key) => {
    response.headers.set(key, value);
  });
  
  intlResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie);
  });
  
  // Set locale cookie if not present
  const locale = request.cookies.get('locale')?.value || defaultLocale;
  if (!request.cookies.get('locale')) {
    response.cookies.set('locale', locale, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
    });
  }
  
  // Use intl response for redirects
  if (intlResponse.status === 307 || intlResponse.status === 308) {
    return intlResponse;
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

