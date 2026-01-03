import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './lib/i18n/config';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export async function middleware(request: NextRequest) {
  // Apply i18n middleware FIRST to handle locale routing
  const intlResponse = intlMiddleware(request);
  
  // If intl middleware redirects (e.g., / -> /en), return it immediately
  if (intlResponse && (intlResponse.status === 307 || intlResponse.status === 308)) {
    return intlResponse;
  }
  
  // Now handle Supabase auth (after locale is established)
  const authResponse = await updateSession(request);
  
  // If auth middleware redirects, use that
  if (authResponse.status === 307 || authResponse.status === 308) {
    return authResponse;
  }
  
  // Use intl response as base, merge auth cookies
  const response = intlResponse instanceof NextResponse ? intlResponse : NextResponse.next({ request });
  authResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie);
  });
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};

