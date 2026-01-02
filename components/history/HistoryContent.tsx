'use client';

import { useTranslations } from 'next-intl';
import { formatDateString } from '@/lib/date-utils';

interface DailyLog {
  id: string;
  date: string;
  consumedSugar: boolean;
  confirmedAt: Date | null;
}

interface HistoryContentProps {
  logs: DailyLog[];
}

export function HistoryContent({ logs }: HistoryContentProps) {
  const t = useTranslations('history');

  // Separate confirmed and unconfirmed logs
  const confirmedLogs = logs.filter((log) => log.confirmedAt !== null);
  const unconfirmedLogs = logs.filter((log) => log.confirmedAt === null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        {t('title')}
      </h1>

      {logs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">{t('noLogs')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Confirmed Logs */}
          {confirmedLogs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('confirmed')}
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {confirmedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDateString(log.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            log.consumedSugar
                              ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300'
                              : 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300'
                          }`}
                        >
                          {log.consumedSugar ? 'Consumed Sugar' : 'No Sugar'}
                        </span>
                        {log.confirmedAt && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(log.confirmedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Unconfirmed Logs */}
          {unconfirmedLogs.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('pending')}
              </h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {unconfirmedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatDateString(log.date)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300">
                          {t('pending')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

