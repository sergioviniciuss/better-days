'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
  ];

  const switchLanguage = (newLocale: string) => {
    // Set cookie
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Update localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', newLocale);
    }

    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <div className="flex items-center space-x-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => switchLanguage(lang.code)}
          disabled={isPending}
          aria-label={`Switch to ${lang.name}`}
          title={lang.name}
          className={`text-2xl transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md ${
            lang.code === locale
              ? 'scale-110 ring-2 ring-blue-500 dark:ring-blue-400 ring-offset-2 dark:ring-offset-gray-800'
              : 'opacity-60 hover:opacity-100 hover:scale-105'
          } ${isPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
}
