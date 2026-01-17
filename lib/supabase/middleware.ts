import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { parseSessionMetadataFromCookie, isSessionExpiredFromMetadata } from '@/lib/session-storage';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          supabaseResponse.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // Refresh session if expired
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // Check custom session expiry AFTER getUser() to follow Supabase SSR best practices
  // Only check if there's an active user session
  if (user) {
    const sessionMetadataCookie = request.cookies.get('betterdays_session_metadata')?.value;
    const sessionMetadata = parseSessionMetadataFromCookie(sessionMetadataCookie);
    
    // If we have session metadata and it's expired, force logout
    if (sessionMetadata && isSessionExpiredFromMetadata(sessionMetadata)) {
      // Clear the session
      await supabase.auth.signOut();
      
      // Extract locale from path
      const pathname = request.nextUrl.pathname;
      const pathParts = pathname.split('/').filter(Boolean);
      const firstPart = pathParts[0];
      const isLocale = ['en', 'pt-BR'].includes(firstPart);
      const locale = isLocale ? firstPart : 'en';
      
      // Redirect to login
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/login`;
      const response = NextResponse.redirect(url);
      
      // IMPORTANT: Copy cookies from supabaseResponse to preserve auth cookie changes from signOut()
      supabaseResponse.cookies.getAll().forEach(cookie => {
        response.cookies.set(cookie);
      });
      
      // Clear the session metadata cookie
      response.cookies.set('betterdays_session_metadata', '', {
        path: '/',
        expires: new Date(0),
      });
      
      return response;
    }
  }

  // Extract locale from path
  const pathname = request.nextUrl.pathname;
  const pathParts = pathname.split('/').filter(Boolean);
  const firstPart = pathParts[0];
  const isLocale = ['en', 'pt-BR'].includes(firstPart);
  const locale = isLocale ? firstPart : 'en';
  const pathWithoutLocale = isLocale ? '/' + pathParts.slice(1).join('/') : pathname;


  if (
    !user &&
    !pathWithoutLocale.startsWith('/login') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next')
  ) {
    // no user, redirect to login page with locale prefix
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    
    // If redirecting from a join page, preserve the invite code
    const joinMatch = pathWithoutLocale.match(/^\/join\/([^\/]+)/);
    if (joinMatch) {
      const inviteCode = joinMatch[1];
      url.searchParams.set('invite', inviteCode);
    }
    
    const response = NextResponse.redirect(url);
    
    // IMPORTANT: Copy cookies from supabaseResponse to preserve session state
    supabaseResponse.cookies.getAll().forEach(cookie => {
      response.cookies.set(cookie);
    });
    
    return response;
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse;
}

