import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { locales, defaultLocale } from '@/lib/i18n/config';
import { Navigation } from '@/components/Navigation';
import '../globals.css';

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

  return (
    <html lang={savedLocale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navigation />
            <main>{children}</main>
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

