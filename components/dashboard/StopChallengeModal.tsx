'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { archiveChallenge } from '@/app/actions/challenge';
import { useRouter, usePathname } from 'next/navigation';

interface StopChallengeModalProps {
    challengeId: string;
    challengeName: string;
    onClose: () => void;
}

export function StopChallengeModal({ challengeId, challengeName, onClose }: StopChallengeModalProps) {
    const t = useTranslations('dashboard');
    const router = useRouter();
    const pathname = usePathname();
    const [loading, setLoading] = useState(false);
    const [showFullPageLoader, setShowFullPageLoader] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleConfirm = async () => {
        setLoading(true);
        setError(null);

        const result = await archiveChallenge(challengeId);

        if (result.error) {
            setError(result.error);
            setLoading(false);
        } else {
            setShowFullPageLoader(true);
            
            // If we're on the challenge detail page, redirect to dashboard
            // If we're already on dashboard, just refresh to avoid navigation flash
            const isOnDashboard = pathname?.includes('/dashboard');
            if (isOnDashboard) {
                router.refresh();
            } else {
                router.push('/dashboard');
                router.refresh();
            }
            
            // Don't call onClose() - let the loader stay visible and page will re-render with fresh data
            // The modal will be unmounted when the component re-renders
        }
    };

    return (
        <>
            {showFullPageLoader && (
                <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-[60]">
                    <div className="text-center">
                        <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                            {t('loading', { defaultValue: 'Updating...' })}
                        </p>
                    </div>
                </div>
            )}
            
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                    {/* Header */}
                    <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                            {t('stopChallenge')}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {challengeName}
                        </p>
                    </div>

                    {/* Warning Message */}
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            {t('stopChallengeConfirm')}
                        </p>

                        {/* Admin Warning */}
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-4">
                            <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                                ⚠️ {t('adminWarning', { defaultValue: 'This will end the challenge for ALL participants' })}
                            </p>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                                {t('stopChallengeGoodNews')}
                            </p>
                            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                <li>✓ {t('stopChallengeKeepProgress')}</li>
                                <li>✓ {t('stopChallengePreserveData')}</li>
                                <li>✓ {t('stopChallengeViewLogs')}</li>
                            </ul>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md font-medium hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                        >
                            {t('cancel')}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
                        >
                            {loading ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                t('stopChallenge')
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

