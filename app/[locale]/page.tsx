import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { defaultLocale } from '@/lib/i18n/config';

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get('locale')?.value || defaultLocale;
  
  // Redirect to dashboard (will be protected)
  redirect(`/${savedLocale}/dashboard`);
}

