import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { learningPaths, pathCompletedCount } from '../data/learningPaths';
import { getWeakestCategory } from '../utils/progressCalculations';
import { Heart, Lock, CheckCircle2, Calendar, Target, Route, Sparkles } from 'lucide-react';
import { getStrings } from '../i18n/strings';
import {
  selectUserProgress,
  selectPassedChallengeIds,
  selectChallengeSummariesForUser,
} from '../store/slices/progressSlice';
import { mergeApiOrLocalProgression } from '../utils/challengeProgression';
import { assignmentsForUser } from '../store/slices/campaignsSlice';

interface GameDashboardProps {
  onNavigate: (page: string) => void;
}

function GameDashboard({ onNavigate }: GameDashboardProps) {
  const user = useSelector((state: RootState) => state.auth.user);
  const challenges = useSelector((state: any) => state.challenges.challenges);
  const assignments = useSelector((state: any) => state.campaigns.assignments);
  const uid = user?.id || '';
  const progress = useSelector(selectUserProgress(uid, challenges));
  const completedIds = useSelector(selectPassedChallengeIds(uid));
  const challengeSummaries = useSelector(selectChallengeSummariesForUser(uid));

  if (!user) return null;

  const t = getStrings().dashboard;
  const mine = assignmentsForUser(assignments, user.id);
  const weakest = getWeakestCategory(progress);

  const weekSlot = Math.floor(Date.now() / (7 * 86400000));
  const spotlight =
    challenges.length > 0 ? challenges[weekSlot % challenges.length] : null;

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      {spotlight && (
        <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 flex flex-wrap items-center gap-4">
          <Sparkles className="text-emerald-600 shrink-0" size={26} />
          <div className="flex-1 min-w-[200px]">
            <div className="text-sm font-medium text-emerald-800">{t.weeklyPick}</div>
            <div className="text-lg font-semibold text-emerald-950">{spotlight.title}</div>
            <p className="text-sm text-emerald-900 mt-1">{t.weeklyPickHelp}</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('challenges')}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
          >
            {t.start}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-900">
            <Heart size={24} />
            <span className="text-2xl font-semibold">{user.reputation}%</span>
          </div>
          <div className="text-neutral-600">{t.reputation}</div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="text-lg font-medium mb-2">{t.streakTitle}</div>
          <div className="text-neutral-600 mb-4">
            {t.streakHelp}{' '}
            <span className="font-semibold text-emerald-700">{progress.currentStreak}</span>
            {progress.longestStreak > 0 && (
              <span className="text-sm text-neutral-500">
                {' '}
                ({t.best} {progress.longestStreak})
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm
                  ${i < progress.currentStreak ? 'border-emerald-500 text-emerald-500' : 'border-neutral-200 text-neutral-300'}`}
              >
                🔥
              </div>
            ))}
          </div>
        </div>
      </div>

      {weakest && weakest.total > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex flex-wrap items-center gap-3">
          <Target className="text-amber-600 shrink-0" size={22} />
          <div className="flex-1 min-w-[200px]">
            <div className="font-medium text-amber-900">{t.recommended}</div>
            <div className="text-sm text-amber-800">
              Practice more in <strong>{weakest.category}</strong> (avg score {weakest.averageScore}%).
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('challenges')}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700"
          >
            {t.browseChallenges}
          </button>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-neutral-900 mb-3 flex items-center gap-2">
          <Calendar size={22} className="text-emerald-600" />
          {t.assignedTitle}
        </h2>
        {mine.length === 0 ? (
          <p className="text-neutral-500 text-sm">{t.noAssignments}</p>
        ) : (
          <div className="space-y-3">
            {mine.map((a) => {
              const due = new Date(a.dueDate);
              const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
              const overdue = days < 0;
              return (
                <div
                  key={a.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
                    overdue ? 'border-red-200 bg-red-50' : 'border-neutral-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="font-medium text-neutral-900">{a.title}</div>
                    <div className="text-sm text-neutral-500">
                      {t.due} {a.dueDate}
                      {overdue ? (
                        <span className="text-red-600 font-medium"> · {t.overdue}</span>
                      ) : (
                        <span>
                          {' '}
                          · {days} {t.daysLeft}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('challenges')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-700"
                  >
                    {t.start}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-xl font-semibold text-neutral-900 mb-3 flex items-center gap-2">
          <Route size={22} className="text-emerald-600" />
          {t.pathsTitle}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {learningPaths.map((path) => {
            const done = pathCompletedCount(path, completedIds);
            const total = path.stepChallengeIds.length;
            return (
              <div key={path.id} className="bg-white rounded-xl border border-neutral-200 p-5 shadow-sm">
                <h3 className="font-semibold text-neutral-900 mb-1">{path.title}</h3>
                <p className="text-sm text-neutral-600 mb-4">{path.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {path.stepChallengeIds.map((cid, idx) => {
                    const doneHere = completedIds.has(cid);
                    const prevId = idx > 0 ? path.stepChallengeIds[idx - 1] : null;
                    const locked = idx > 0 && prevId !== null && !completedIds.has(prevId);
                    const title = challenges.find((c: any) => c.id === cid)?.title ?? `Challenge ${cid}`;
                    return (
                      <div
                        key={cid}
                        className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                          doneHere
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : locked
                              ? 'border-neutral-200 bg-neutral-50 text-neutral-400'
                              : 'border-amber-200 bg-amber-50 text-amber-900'
                        }`}
                        title={title}
                      >
                        {locked ? <Lock size={12} /> : doneHere ? <CheckCircle2 size={12} /> : null}
                        <span className="truncate max-w-[140px]">{title}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-sm text-neutral-600">
                  Progress: {done} / {total} steps
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-neutral-900 mb-6">{t.challengesTitle}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {challenges.map((challenge: any) => {
          const done = completedIds.has(challenge.id);
          const { progressionLocked, progressionLockReason } = mergeApiOrLocalProgression(
            challenge,
            challenges,
            completedIds,
          );
          const summary = challengeSummaries[challenge.id];
          const barPct = done ? 100 : summary?.bestScore ?? 0;
          return (
            <div
              key={challenge.id}
              title={progressionLocked ? progressionLockReason || undefined : undefined}
              className={`bg-white rounded-xl p-6 shadow-sm transition-shadow tap-highlight border ${
                progressionLocked
                  ? 'opacity-80 cursor-pointer hover:shadow-md'
                  : 'cursor-pointer hover:shadow-md'
              } ${done ? 'border-emerald-200 ring-1 ring-emerald-50' : 'border-transparent'}`}
              onClick={() => onNavigate('challenges')}
            >
              <div className="flex justify-between items-start gap-3 mb-4">
                <h3 className="text-lg font-medium">{challenge.title}</h3>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {progressionLocked && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 px-2 py-1 rounded-full">
                      <Lock size={12} />
                      Locked
                    </span>
                  )}
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm">
                    {challenge.difficulty}
                  </span>
                  {done && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                      <CheckCircle2 size={14} />
                      {t.completedLabel}
                    </span>
                  )}
                </div>
              </div>
              <p className="text-neutral-600 mb-3">{challenge.description}</p>
              <div className="mb-4">
                <div className="flex justify-between text-xs text-neutral-500 mb-1">
                  <span>{t.progressLabel}</span>
                  <span>{barPct}%</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      progressionLocked ? 'bg-neutral-300' : done ? 'bg-emerald-500' : 'bg-amber-400'
                    }`}
                    style={{ width: `${progressionLocked ? 0 : barPct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-500">
                <span>🕒 {challenge.duration} min</span>
                <span>⭐ {challenge.xpReward} XP</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GameDashboard;
