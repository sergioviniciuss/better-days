import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

  // Extract locale from path
  const pathname = request.nextUrl.pathname;
  const pathParts = pathname.split('/').filter(Boolean);
  const firstPart = pathParts[0];
  const isLocale = ['en', 'pt-BR'].includes(firstPart);
  const locale = isLocale ? firstPart : 'en';
  const pathWithoutLocale = isLocale ? '/' + pathParts.slice(1).join('/') : pathname;

  // Debug logging
  const authCookie = request.cookies.get('sb-hlczfedujqhdczrgaxky-auth-token');
  console.log('[Middleware]', {
    pathname,
    hasSession: !!session,
    hasUser: !!user,
    userId: user?.id,
    cookies: request.cookies.getAll().map(c => c.name),
    sessionExpiry: session?.expires_at,
    sessionError: sessionError?.message,
    userError: userError?.message,
    cookieLength: authCookie?.value?.length,
  });

  if (
    !user &&
    !pathWithoutLocale.startsWith('/login') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next')
  ) {
    console.log('[Middleware] Redirecting to login - no user found');
    // no user, redirect to login page with locale prefix
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
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

