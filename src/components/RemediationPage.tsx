import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useChallenges } from '../context/ChallengeContext';
import { getRemediationItems } from '../utils/remediation';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface RemediationPageProps {
  onNavigate: (page: string) => void;
}

export default function RemediationPage({ onNavigate }: RemediationPageProps) {
  const { user } = useAuth();
  const { challenges } = useChallenges();

  if (!user) return null;

  const raw = JSON.parse(localStorage.getItem('challengeAttempts') || '[]');
  const items = getRemediationItems(user.id, challenges, raw);

  const openChallenge = (challengeId: string) => {
    sessionStorage.setItem('practikal-focus-challenge', challengeId);
    onNavigate('challenges');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Review mistakes</h1>
        <p className="text-gray-600 mb-8">
          Steps you answered incorrectly on past attempts. Retry the challenge to improve your score.
        </p>

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
            No missed steps recorded yet. Complete challenges to build your review list.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item, idx) => (
              <li
                key={`${item.attemptId}-${item.stepId}-${idx}`}
                className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <div className="font-medium text-gray-900">{item.challengeTitle}</div>
                    <div className="text-sm text-gray-500">
                      Step {item.stepId} · {item.category} ·{' '}
                      {item.completedAt.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openChallenge(item.challengeId)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                >
                  Retry challenge
                  <ArrowRight size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
