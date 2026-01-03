'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createPersonalChallenge } from '@/app/actions/challenge';
import { ChallengeIcon } from '@/lib/challenge-icons';

interface OnboardingFlowProps {
  userId: string;
  locale: string;
}

export function OnboardingFlow({ userId, locale }: OnboardingFlowProps) {
  const t = useTranslations('onboarding');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedRules, setSelectedRules] = useState<string[]>(['addedSugarCounts', 'fruitDoesNotCount']);

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const toggleRule = (rule: string) => {
    setSelectedRules(prev =>
      prev.includes(rule)
        ? prev.filter(r => r !== rule)
        : [...prev, rule]
    );
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      // Create personal challenge with selected rules
      const result = await createPersonalChallenge(userId, selectedRules);
      
      if (result.error) {
        console.error('Failed to create personal challenge:', result.error);
        // Even if challenge creation fails, proceed
      }
      
      // Mark onboarding as completed (done via server action)
      const response = await fetch('/api/complete-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        console.error('Failed to mark onboarding as complete');
      }
      
      // Redirect to dashboard
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Proceed anyway
      router.push(`/${locale}/dashboard`);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex justify-center px-4 py-20">
      <div className="max-w-2xl w-full h-fit bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-2 w-16 rounded-full transition-colors ${
                i === step
                  ? 'bg-blue-600'
                  : i < step
                  ? 'bg-blue-400'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="text-center space-y-6 animate-fade-in min-h-[400px] flex flex-col justify-between">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white">
                {t('welcome')}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t('welcomeDescription')}
              </p>
            </div>
            <div className="pt-8">
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px] min-w-[56px]"
              >
                {tCommon('next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: How It Works */}
        {step === 2 && (
          <div className="space-y-8 animate-fade-in min-h-[400px] flex flex-col justify-between">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-white">
                {t('howItWorks')}
              </h2>
              
              <div className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {t('step1Title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('step1Description')}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {t('step2Title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('step2Description')}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xl">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {t('step3Title')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('step3Description')}
                  </p>
                </div>
              </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-6">
              <button
                onClick={handleBack}
                className="px-8 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px] min-w-[56px]"
              >
                {tCommon('back')}
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px] min-w-[56px]"
              >
                {tCommon('next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: First Challenge */}
        {step === 3 && (
          <div className="text-center space-y-6 animate-fade-in min-h-[400px] flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {t('firstChallenge')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t('firstChallengeDescription')}
              </p>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-8 my-8">
                <ChallengeIcon 
                  type="NO_SUGAR_STREAK" 
                  size="xl" 
                  className="mx-auto mb-4"
                />
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('challengeName')}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('challengeSubtitle')}
                </p>
              </div>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={handleBack}
                className="px-8 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px] min-w-[56px]"
              >
                {tCommon('back')}
              </button>
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px] min-w-[56px]"
              >
                {tCommon('next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Select Rules */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in min-h-[400px] flex flex-col justify-between">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {t('selectRules')}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('selectRulesDescription')}
                </p>
              </div>

              {/* Nutrition Label Tip */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {t('nutritionTipTitle')}
                </h3>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  {t('nutritionTip')}
                </p>
              </div>

              <div className="space-y-4">
                {/* Rule: Added Sugar Counts */}
                <label className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedRules.includes('addedSugarCounts')}
                    onChange={() => toggleRule('addedSugarCounts')}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {t('rules.addedSugarCounts')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('rules.addedSugarCountsHelp')}
                    </div>
                  </div>
                </label>

                {/* Rule: Fruit Does Not Count */}
                <label className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedRules.includes('fruitDoesNotCount')}
                    onChange={() => toggleRule('fruitDoesNotCount')}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {t('rules.fruitDoesNotCount')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('rules.fruitDoesNotCountHelp')}
                    </div>
                  </div>
                </label>

                {/* Rule: Processed Sugar Only */}
                <label className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedRules.includes('processedSugarOnly')}
                    onChange={() => toggleRule('processedSugarOnly')}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {t('rules.processedSugarOnly')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('rules.processedSugarOnlyHelp')}
                    </div>
                  </div>
                </label>

                {/* Rule: Missing Days Pending */}
                <label className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedRules.includes('missingDaysPending')}
                    onChange={() => toggleRule('missingDaysPending')}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {t('rules.missingDaysPending')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('rules.missingDaysPendingHelp')}
                    </div>
                  </div>
                </label>

                {/* Rule: Alcohol Permitted */}
                <label className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedRules.includes('alcoholPermitted')}
                    onChange={() => toggleRule('alcoholPermitted')}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {t('rules.alcoholPermitted')}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('rules.alcoholPermittedHelp')}
                    </div>
                  </div>
                </label>
              </div>

              {selectedRules.length === 0 && (
                <div className="text-center text-sm text-gray-500 dark:text-gray-400 italic">
                  {t('noRulesSelected')}
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4 pt-6">
              <button
                onClick={handleBack}
                disabled={loading}
                className="px-8 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:bg-gray-400 text-gray-900 dark:text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px] min-w-[56px]"
              >
                {tCommon('back')}
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px] min-w-[56px]"
              >
                {loading ? t('creatingChallenge') : t('letsGo')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

