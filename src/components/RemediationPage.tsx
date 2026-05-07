import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectChallengeAttemptsRaw } from '../store/slices/progressSlice';
import { getRemediationItems } from '../utils/remediation';
import { 
  AlertCircle, 
  ArrowRight, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  ChevronRight,
  Info
} from 'lucide-react';
import { useGetGamificationProgressMeQuery } from '../store/apiSlice/practikalApi';
import { useGamificationApi } from '../config/gamification';
import { mapGamificationAttemptsToChallengeAttempts, type GamificationProgressAttemptDto } from '../utils/gamificationApi';
import type { Challenge } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { interpolate } from '../i18n/messages';

interface RemediationPageProps {
  onNavigate: (page: string) => void;
}

export default function RemediationPage({ onNavigate }: RemediationPageProps) {
  const { messages } = useI18n();
  const r = messages.remediation;
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
    return { mergedChallenges: reduxChallenges, rawAttempts: rawLocal as unknown[], usedServer: false };
  }, [user, useGamificationApi, isSuccess, progressData, reduxChallenges, rawLocal]);

  if (!user) return null;

  const items = getRemediationItems(user.id, mergedChallenges, rawAttempts);

  const openChallenge = (challengeId: string) => {
    sessionStorage.setItem('practikal-focus-challenge', challengeId);
    onNavigate('challenges');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Header */}
      <div className="bg-neutral-50/50 border-b border-neutral-100">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-xl font-black tracking-tight text-neutral-900 sm:text-2xl leading-tight">
                {r.title}
              </h1>
            </div>
            {items.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 rounded-full border border-amber-100">
                <ShieldAlert size={16} className="text-amber-500" />
                <span className="text-[10px] font-black text-amber-700 uppercase tracking-wider">
                  {items.length} Points of Interest
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Loading & Error States */}
        {useGamificationApi && isFetching && (
          <div className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl border border-neutral-100 mb-6 animate-pulse">
            <Clock size={20} className="text-neutral-400" />
            <p className="text-sm text-neutral-500 font-medium">{r.loadingAttempts}</p>
          </div>
        )}

        {useGamificationApi && isError && !usedServer && (
          <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100 mb-6" role="alert">
            <AlertCircle size={20} className="text-red-500" />
            <p className="text-sm text-red-700 font-medium">{r.serverError}</p>
          </div>
        )}

        {/* Remediation Items List */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl border-2 border-dashed border-neutral-100 bg-neutral-50/30">
            <div className="bg-white p-4 rounded-full shadow-sm text-emerald-500">
              <CheckCircle2 size={48} />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-black text-neutral-900">You're all clear!</p>
              <p className="text-sm text-neutral-400 font-medium max-w-xs mx-auto">
                {r.emptyState}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div
                key={`${item.attemptId}-${item.stepId}-${idx}`}
                className="group relative overflow-hidden bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <ShieldAlert size={22} className="text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-[9px] font-black uppercase tracking-wider">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-bold text-neutral-400">
                          {item.completedAt.toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-neutral-900 leading-tight">
                        {item.challengeTitle}
                      </h3>
                      <p className="text-xs text-neutral-500 font-medium">
                        {interpolate(r.stepLine, {
                          step: item.stepId,
                          category: item.category,
                          date: '', // Handled above
                        }).replace('()', '').trim()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => openChallenge(item.challengeId)}
                    className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-neutral-900 text-white transition-transform group-hover:scale-110 shadow-sm"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>

                {/* Footer Action Info */}
                <div className="mt-4 pt-4 border-t border-neutral-50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    <Info size={12} />
                    Review Recommended
                  </div>
                  <button 
                    onClick={() => openChallenge(item.challengeId)}
                    className="text-xs font-black text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    {r.retryChallenge} <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
