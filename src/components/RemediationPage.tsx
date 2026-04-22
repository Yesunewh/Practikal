import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectChallengeAttemptsRaw } from '../store/slices/progressSlice';
import { getRemediationItems } from '../utils/remediation';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useGetGamificationProgressMeQuery } from '../store/apiSlice/practikalApi';
import { useGamificationApi } from '../config/gamification';
import { mapGamificationAttemptsToChallengeAttempts, type GamificationProgressAttemptDto } from '../utils/gamificationApi';
import type { Challenge } from '../types';

interface RemediationPageProps {
  onNavigate: (page: string) => void;
}

export default function RemediationPage({ onNavigate }: RemediationPageProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const reduxChallenges = useSelector((state: RootState) => state.challenges.challenges);
  const rawLocal = useSelector(selectChallengeAttemptsRaw);

  const { data: progressData, isFetching, isError, isSuccess } = useGetGamificationProgressMeQuery(undefined, {
    skip: !useGamificationApi || !user,
  });

  const { mergedChallenges, rawAttempts, usedServer } = useMemo(() => {
    if (!user) {
      return { mergedChallenges: [] as Challenge[], rawAttempts: [] as unknown[], usedServer: false };
    }
    if (useGamificationApi && isSuccess && progressData) {
      const attempts = (progressData.attempts ?? []) as GamificationProgressAttemptDto[];
      const mapped = mapGamificationAttemptsToChallengeAttempts(attempts);
      const map = new Map<string, Challenge>(reduxChallenges.map((c) => [c.id, c]));
      for (const row of attempts) {
        const ch = row.challenge;
        if (ch?.id && !map.has(ch.id)) {
          map.set(ch.id, ch);
        }
      }
      return {
        mergedChallenges: Array.from(map.values()),
        rawAttempts: mapped as unknown[],
        usedServer: true,
      };
    }
    if (useGamificationApi) {
      return {
        mergedChallenges: reduxChallenges,
        rawAttempts: rawLocal as unknown[],
        usedServer: false,
      };
    }
    return { mergedChallenges: reduxChallenges, rawAttempts: rawLocal as unknown[], usedServer: false };
  }, [user, useGamificationApi, isSuccess, progressData, reduxChallenges, rawLocal]);

  if (!user) return null;

  const items = getRemediationItems(user.id, mergedChallenges, rawAttempts);

  const openChallenge = (challengeId: string) => {
    sessionStorage.setItem('practikal-focus-challenge', challengeId);
    onNavigate('challenges');
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Review mistakes</h1>
        <p className="text-neutral-600 mb-8">
          Steps you answered incorrectly on past attempts. Retry the challenge to improve your score.
        </p>

        {useGamificationApi && isFetching && (
          <p className="text-sm text-neutral-500 mb-4">Loading your attempts from the server…</p>
        )}

        {useGamificationApi && isError && !usedServer && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4" role="alert">
            Could not load attempts from the server. Showing locally stored attempts only, if any.
          </p>
        )}

        {useGamificationApi && usedServer && !isFetching && (progressData?.attempts?.length ?? 0) === 0 && (
          <p className="text-sm text-neutral-500 mb-4">No challenge attempts on your account yet.</p>
        )}

        {items.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center text-neutral-500">
            No missed steps recorded yet. Complete challenges (with the app connected to the server) to build your
            review list.
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item, idx) => (
              <li
                key={`${item.attemptId}-${item.stepId}-${idx}`}
                className="bg-white rounded-xl border border-neutral-200 p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <div className="font-medium text-neutral-900">{item.challengeTitle}</div>
                    <div className="text-sm text-neutral-500">
                      Step {item.stepId} · {item.category} · {item.completedAt.toLocaleDateString()}
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
