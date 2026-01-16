import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import dynamic from 'next/dynamic';
import { locales, defaultLocale } from '@/lib/i18n/config';
import { Navigation } from '@/components/Navigation';
import { getCurrentUser } from '@/app/actions/auth';

const NavigationProgressBar = dynamic(
  () => import("@/components/NavigationProgressBar").then((mod) => mod.NavigationProgressBar),
  { ssr: false }
);

const SessionMonitor = dynamic(
  () => import("@/components/SessionMonitor").then((mod) => mod.SessionMonitor),
  { ssr: false }
);

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  if (!locales.includes(locale as any)) {
    notFound();
  }

  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('locale')?.value || defaultLocale;
  const messages = await getMessages({ locale: savedLocale as any });

  const user = await getCurrentUser();

  return (
    <NextIntlClientProvider messages={messages}>
      <NavigationProgressBar />
      {user && <SessionMonitor />}
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navigation userEmail={user?.email} />
        <main>{children}</main>
      </div>
    </NextIntlClientProvider>
  );
}

