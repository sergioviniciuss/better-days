'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createChallenge } from '@/app/actions/challenge';
import { getTodayInTimezone } from '@/lib/date-utils';
import { CHALLENGE_TYPES, type ChallengeType } from '@/lib/challenge-types';

interface CreateChallengeWizardProps {
  onClose: () => void;
  userTimezone: string;
}

export function CreateChallengeWizard({ onClose, userTimezone }: CreateChallengeWizardProps) {
  const t = useTranslations('createChallengeWizard');
  const tTypes = useTranslations('challengeTypes');
  const tChallenges = useTranslations('challenges');
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ChallengeType | null>(null);
  const [challengeName, setChallengeName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showFullPageLoader, setShowFullPageLoader] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = getTodayInTimezone(userTimezone);

  const handleTypeSelect = (type: ChallengeType) => {
    setSelectedType(type);
    const config = CHALLENGE_TYPES[type];
    setSelectedRules(config.defaultRules);
  };

  const toggleRule = (rule: string) => {
    setSelectedRules(prev =>
      prev.includes(rule)
        ? prev.filter(r => r !== rule)
        : [...prev, rule]
    );
  };

  const handleSubmit = async () => {
    if (!selectedType || !challengeName.trim()) return;

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.append('name', challengeName);
    formData.append('startDate', today);
    if (dueDate) {
      formData.append('dueDate', dueDate);
    }
    formData.append('challengeType', 'GROUP');
    formData.append('objectiveType', selectedType);
    
    selectedRules.forEach(rule => {
      formData.append(rule, 'on');
    });

    const result = await createChallenge(formData);
    
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      setShowFullPageLoader(true);
      router.push(`/challenges/${result.challengeId}`);
      router.refresh();
      // Don't call onClose() - let the loader stay visible until navigation completes
      // The modal will be unmounted when we navigate away
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
              {t('creating')}
            </p>
          </div>
        </div>
      )}
      
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {tChallenges('createChallenge')}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px]"
            >
              ✕
            </button>
          </div>

          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 w-16 rounded-full transition-colors ${
                  i === step ? 'bg-blue-600' : i < step ? 'bg-blue-400' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-md mb-4">
              {error}
            </div>
          )}

          {/* Step 1: Choose Challenge Type */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('step1Title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('step1Description')}
                </p>
              </div>

              <div className="space-y-3">
                {Object.values(CHALLENGE_TYPES).map((config) => (
                  <button
                    key={config.id}
                    onClick={() => handleTypeSelect(config.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedType === config.id
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{config.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                          {tTypes(config.nameKey)}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {tTypes(config.descriptionKey)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={!selectedType}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {t('next')}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Name Challenge */}
          {step === 2 && selectedType && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('step2Title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('step2Description')}
                </p>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tChallenges('challengeName')}
                </label>
                <input
                  type="text"
                  id="name"
                  value={challengeName}
                  onChange={(e) => setChallengeName(e.target.value)}
                  placeholder={tTypes(CHALLENGE_TYPES[selectedType].suggestedNameKey)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {tChallenges('dueDate')}
                </label>
                <input
                  type="date"
                  id="dueDate"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={today}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {tChallenges('dueDateHelper')}
                </p>
              </div>

              <div className="flex justify-between gap-4 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium min-h-[44px]"
                >
                  {t('back')}
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!challengeName.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {t('next')}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Customize Rules */}
          {step === 3 && selectedType && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {t('step3Title')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('step3Description')}
                </p>
              </div>

              <div className="space-y-2">
                {CHALLENGE_TYPES[selectedType].availableRules.map((rule) => (
                  <label key={rule} className="flex items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedRules.includes(rule)}
                      onChange={() => toggleRule(rule)}
                      className="mr-3 h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {tChallenges(rule)}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between gap-4 pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={submitting}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-medium min-h-[44px]"
                >
                  {t('back')}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {submitting ? t('creating') : t('create')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

