'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createPersonalChallenge, upgradeToGroupChallenge } from '@/app/actions/challenge';
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
  const [inviteChoice, setInviteChoice] = useState<'yes' | 'no' | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
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

  const handleCreateChallenge = async () => {
    setLoading(true);
    try {
      // Create personal challenge with selected rules
      const result = await createPersonalChallenge(userId, selectedRules);
      
      if (result.error) {
        console.error('Failed to create personal challenge:', result.error);
        setLoading(false);
        return;
      }
      
      if (result.challengeId) {
        setChallengeId(result.challengeId);
        setLoading(false);
        setStep(5); // Go to invite step
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      setLoading(false);
    }
  };

  const handleInviteFriends = async () => {
    if (!challengeId) return;
    
    setLoading(true);
    // Upgrade challenge to GROUP and generate invite
    const result = await upgradeToGroupChallenge(challengeId);
    
    if (result.success && result.inviteCode) {
      setInviteCode(result.inviteCode);
      setInviteChoice('yes');
    }
    setLoading(false);
  };

  const handleSkipInvite = async () => {
    setInviteChoice('no');
    await handleFinishOnboarding();
  };

  const handleFinishOnboarding = async () => {
    // Mark onboarding as completed
    await fetch('/api/complete-onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    
    router.push(`/${locale}/dashboard`);
    router.refresh();
  };

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex justify-center px-4 py-20">
      <div className="max-w-2xl w-full h-fit bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
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
                onClick={handleCreateChallenge}
                disabled={loading}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px] min-w-[56px]"
              >
                {loading ? t('creatingChallenge') : tCommon('next')}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Invite Friends (Optional) */}
        {step === 5 && !inviteChoice && (
          <div className="text-center space-y-6 animate-fade-in min-h-[400px] flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {t('inviteFriends')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t('inviteFriendsDescription')}
              </p>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-8 my-8">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-600 dark:text-gray-300">
                  Challenge friends, compare streaks, and stay motivated together!
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 pt-4">
              <button
                onClick={handleInviteFriends}
                disabled={loading}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px]"
              >
                {loading ? t('generatingInvite') : t('inviteFriendsYes')}
              </button>
              <button
                onClick={handleSkipInvite}
                className="px-8 py-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px]"
              >
                {t('inviteFriendsSkip')}
              </button>
            </div>
          </div>
        )}

        {/* Step 5b: Show Invite Code if generated */}
        {step === 5 && inviteChoice === 'yes' && inviteCode && (
          <div className="text-center space-y-6 animate-fade-in min-h-[400px] flex flex-col justify-between">
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                {t('inviteCodeReady')}
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                {t('inviteCodeReadyDescription')}
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-8 my-8">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  {t('inviteCodeLabel')}
                </p>
                <code className="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400">
                  {inviteCode}
                </code>
              </div>
              
              <button
                onClick={handleCopyCode}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                {codeCopied ? t('codeCopied') : t('copyCode')}
              </button>
            </div>

            <div className="pt-4">
              <button
                onClick={handleFinishOnboarding}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg transition-colors min-h-[56px]"
              >
                {t('letsGo')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

