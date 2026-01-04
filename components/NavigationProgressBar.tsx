'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
  easing: 'ease',
  speed: 500
});

export function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // #region agent log
  useEffect(() => {
    console.log('[DEBUG NavigationProgressBar] Component mounted', {pathname, searchParams: searchParams?.toString()});
    fetch('http://127.0.0.1:7243/ingest/47edcfc9-24b8-4790-8f1d-efb2fa213a1f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NavigationProgressBar.tsx:20',message:'Component mounted',data:{pathname,searchParamsStr:searchParams?.toString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    
    // Intercept all link clicks to start progress bar
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href && link.href.startsWith(window.location.origin) && !link.target) {
        console.log('[DEBUG NavigationProgressBar] Link clicked, starting NProgress', {href: link.href});
        NProgress.start();
        fetch('http://127.0.0.1:7243/ingest/47edcfc9-24b8-4790-8f1d-efb2fa213a1f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NavigationProgressBar.tsx:30',message:'Link clicked - NProgress started',data:{href:link.href},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
      }
    };
    
    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);
  // #endregion

  useEffect(() => {
    // #region agent log
    console.log('[DEBUG NavigationProgressBar] Route change completed - finishing NProgress', {pathname, searchParams: searchParams?.toString()});
    fetch('http://127.0.0.1:7243/ingest/47edcfc9-24b8-4790-8f1d-efb2fa213a1f',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'NavigationProgressBar.tsx:47',message:'Route change completed',data:{pathname,searchParamsStr:searchParams?.toString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Complete progress when route changes
    NProgress.done();
    console.log('[DEBUG NavigationProgressBar] NProgress.done() called after route change');
  }, [pathname, searchParams]);

  return null;
}

