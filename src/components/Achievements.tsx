import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Key,
  Medal,
  Printer,
  Shield,
  Target,
  Trophy,
} from 'lucide-react';
import type { Achievement } from '../types';
import { selectUserProgress } from '../store/slices/progressSlice';
import { useGetGamificationAchievementsMeQuery } from '../store/apiSlice/practikalApi';
import { useGamificationApi } from '../config/gamification';
import { achievements as offlineAchievementDefs } from '../data/mockData';

type ApiAchievementRow = {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  progress?: number;
  total?: number;
  completed?: boolean;
  completedAt?: string | null;
};

function mapApiRows(rows: ApiAchievementRow[]): Achievement[] {
  return rows.map((a) => ({
    id: String(a.id),
    title: a.title,
    description: a.description ?? '',
    icon: a.icon ?? 'award',
    progress: a.progress ?? 0,
    total: a.total ?? 1,
    completed: a.completed === true,
    completedAt: a.completedAt ?? null,
  }));
}

function isEarned(a: Achievement): boolean {
  if (a.completed === true) return true;
  const t = a.total ?? 0;
  const p = a.progress ?? 0;
  if (t > 0 && p >= t) return true;
  return false;
}

function formatUnlockedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString();
}

export default function Achievements() {
  const user = useSelector((state: RootState) => state.auth.user);
  const challenges = useSelector((state: RootState) => state.challenges.challenges);

  const skipApi = !useGamificationApi || !user;
  const { data: achievementsRes, isFetching, isSuccess, isError } = useGetGamificationAchievementsMeQuery(undefined, {
    skip: skipApi,
  });

  const achievementsList = useMemo((): Achievement[] => {
    if (!skipApi && isSuccess && achievementsRes?.achievements) {
      return mapApiRows(achievementsRes.achievements as ApiAchievementRow[]);
    }
    if (!skipApi) {
      return [];
    }
    return offlineAchievementDefs.map((a) => ({
      ...a,
      completed: false,
      completedAt: null,
    }));
  }, [skipApi, isSuccess, achievementsRes?.achievements]);

  const sortedList = useMemo(() => {
    const list = [...achievementsList];
    list.sort((a, b) => {
      const ea = isEarned(a) ? 1 : 0;
      const eb = isEarned(b) ? 1 : 0;
      if (eb !== ea) return eb - ea;
      const pa = (a.progress ?? 0) / Math.max(a.total ?? 1, 1);
      const pb = (b.progress ?? 0) / Math.max(b.total ?? 1, 1);
      return pb - pa;
    });
    return list;
  }, [achievementsList]);

  const userProgress = useSelector(selectUserProgress(user?.id || '', challenges));

  const getIcon = (iconName: string, earned: boolean) => {
    const iconProps = {
      size: 28,
      className: earned ? 'text-amber-500' : 'text-gray-400',
      strokeWidth: 1.75,
    };
    switch (iconName) {
      case 'award':
        return <Award {...iconProps} />;
      case 'key':
        return <Key {...iconProps} />;
      case 'shield':
        return <Shield {...iconProps} />;
      case 'flame':
        return <Flame {...iconProps} />;
      case 'target':
        return <Target {...iconProps} />;
      default:
        return <Medal {...iconProps} />;
    }
  };

  const getProgressPercentage = (achievement: Achievement) => {
    const total = achievement.total ?? 1;
    const progress = achievement.progress ?? 0;
    return Math.min(100, Math.round((progress / total) * 100));
  };

  const earnedCount = achievementsList.filter(isEarned).length;
  const totalCount = achievementsList.length;
  const badgePct = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;
  const nextGoal = sortedList.find((a) => !isEarned(a));

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const showApiLoading = useGamificationApi && user && isFetching && !achievementsRes;
  const showApiEmpty = !skipApi && isSuccess && totalCount === 0;
  const showOfflineNote = skipApi && user;

  return (
    <>
      <div className="print:hidden min-h-screen overflow-auto bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-5">
          {/* Hero card — header + summary + stats (matches Challenges-style cards) */}
          <div className="rounded-2xl border border-emerald-100/90 bg-gradient-to-b from-emerald-50/40 via-white to-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <Medal className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg font-semibold tracking-tight text-emerald-950 sm:text-xl">Achievements</h1>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-emerald-800/80 sm:text-sm">
                    {useGamificationApi
                      ? 'Badges sync from the server when you pass challenges, build streaks, or meet other goals.'
                      : 'Gamification API is off — static list only. Enable the API for live progress.'}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                <div className="tabular-nums text-lg font-semibold text-emerald-900 sm:text-xl">
                  {earnedCount}
                  <span className="text-sm font-medium text-emerald-700/80">/{totalCount || '—'}</span>
                </div>
                <span className="text-[11px] font-medium uppercase tracking-wide text-emerald-700/70">badges earned</span>
              </div>
            </div>

            {showApiLoading && (
              <p className="mt-3 text-sm text-emerald-800/80">Loading achievements…</p>
            )}
            {isError && useGamificationApi && !skipApi && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                Could not load achievements. Try again later.
              </p>
            )}

            {totalCount > 0 && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-[10px] font-medium uppercase tracking-wide text-emerald-800/70">
                  <span>Badge collection</span>
                  <span className="tabular-nums">{badgePct}%</span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-emerald-100/90"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={badgePct}
                  aria-label={`${earnedCount} of ${totalCount} achievements earned`}
                >
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                    style={{ width: `${badgePct}%` }}
                  />
                </div>
              </div>
            )}

            {nextGoal && (
              <div className="mt-4 rounded-xl border border-emerald-100/80 bg-white/70 px-3 py-2.5 text-sm text-emerald-900">
                <span className="text-emerald-700/80">Next goal: </span>
                <span className="font-medium">{nextGoal.title}</span>
                <span className="text-emerald-700/75">
                  {' '}
                  ({nextGoal.progress ?? 0}/{nextGoal.total ?? 1})
                </span>
              </div>
            )}

            {userProgress && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                <div className="rounded-xl border border-gray-100 bg-white/90 px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                    Challenges
                  </div>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">
                    {userProgress.totalChallengesCompleted}
                  </p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white/90 px-3 py-2.5 shadow-sm">
                  <div className="text-[10px] font-medium uppercase tracking-wide text-gray-500">Avg score</div>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">{userProgress.averageScore}%</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white/90 px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    <Clock className="h-3.5 w-3.5 text-emerald-600" />
                    Time
                  </div>
                  <p className="mt-1 text-lg font-semibold text-gray-900">{formatTime(userProgress.totalTimeSpent)}</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white/90 px-3 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
                    <Flame className="h-3.5 w-3.5 text-orange-500" />
                    Streak
                  </div>
                  <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900">{userProgress.currentStreak}d</p>
                </div>
              </div>
            )}

            {showOfflineNote && (
              <p className="mt-3 text-[11px] text-emerald-800/65">Training stats above use your local progress record.</p>
            )}

            {user && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-900 shadow-sm hover:bg-emerald-50/80"
                >
                  <Printer className="h-4 w-4" />
                  Print summary
                </button>
              </div>
            )}
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          {showApiEmpty && (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-600 shadow-sm">
              No achievements are in the catalog yet. An admin can add definitions in the database or seed data.
            </div>
          )}

          {!showApiEmpty && (
            <ul className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
              {sortedList.map((achievement) => {
                const earned = isEarned(achievement);
                const pct = getProgressPercentage(achievement);
                const dateLabel = earned ? formatUnlockedDate(achievement.completedAt ?? null) : null;

                return (
                  <li
                    key={achievement.id}
                    className={`flex gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:p-5 ${
                      earned ? 'border-amber-200/90 ring-1 ring-amber-100/40' : 'border-gray-100'
                    }`}
                  >
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                        earned ? 'bg-amber-50' : 'bg-gray-50'
                      }`}
                    >
                      {getIcon(achievement.icon, earned)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 gap-y-1">
                        <h2 className={`font-semibold ${earned ? 'text-gray-900' : 'text-gray-700'}`}>
                          {achievement.title}
                        </h2>
                        {earned && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-900">
                            Earned
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{achievement.description}</p>

                      {achievement.total != null && achievement.total > 0 && (
                        <div className="mt-3">
                          <div className="mb-1 flex justify-between text-xs text-gray-500">
                            <span>Progress</span>
                            <span className="tabular-nums">
                              {achievement.progress ?? 0} / {achievement.total}
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full transition-all ${earned ? 'bg-amber-400' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {earned && dateLabel && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-800">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          <span>Unlocked {dateLabel}</span>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </main>
      </div>

      <div
        id="practikal-certificate"
        className="hidden print:block min-h-screen max-w-3xl bg-white p-10 text-gray-900 mx-auto"
      >
        <h1 className="mb-6 border-b pb-4 text-2xl font-bold">Practikal — learning summary</h1>
        {user && (
          <>
            <p className="mb-6 text-sm text-gray-600">
              Generated {new Date().toLocaleDateString()} · {user.name} · {user.organization}
            </p>
            {userProgress && (
              <ul className="space-y-3 text-base">
                <li>
                  <strong>Challenges completed:</strong> {userProgress.totalChallengesCompleted} /{' '}
                  {userProgress.totalChallengesAvailable}
                </li>
                <li>
                  <strong>Completion rate:</strong> {userProgress.completionRate.toFixed(0)}%
                </li>
                <li>
                  <strong>Average score:</strong> {userProgress.averageScore}%
                </li>
                <li>
                  <strong>Learning streak (days):</strong> {userProgress.currentStreak} (best {userProgress.longestStreak})
                </li>
                <li>
                  <strong>Total learning time:</strong> {formatTime(userProgress.totalTimeSpent)}
                </li>
              </ul>
            )}
            {achievementsList.filter(isEarned).length > 0 && (
              <div className="mt-8">
                <h2 className="mb-2 font-semibold">Achievements earned</h2>
                <ul className="list-disc space-y-1 pl-5 text-sm">
                  {achievementsList.filter(isEarned).map((a) => (
                    <li key={a.id}>{a.title}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-10 text-sm text-gray-500">
              This document was produced from your training record for awareness purposes only.
            </p>
          </>
        )}
      </div>
    </>
  );
}
