import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectPassedChallengeIds, selectChallengeSummariesForUser } from '../store/slices/progressSlice';
import {
  Clock,
  Star,
  ChevronRight,
  CheckCircle2,
  Lock,
  Search,
  SlidersHorizontal,
  X,
  Info,
  ChevronDown,
} from 'lucide-react';
import { mergeApiOrLocalProgression } from '../utils/challengeProgression';
import { categoryDisplayLabel, CHALLENGE_PASS_SCORE_PERCENT } from '../constants/challenges';
import ActiveChallenge from './ActiveChallenge';
import { useGetGamificationChallengesQuery } from '../store/apiSlice/practikalApi';
import { useGamificationApi } from '../config/gamification';
import type { Challenge } from '../types';

const ALL_CATEGORIES: Challenge['category'][] = [
  'phishing',
  'malware',
  'password',
  'general',
  'social-engineering',
  'incident-response',
];

const ALL_DIFFICULTIES: Challenge['difficulty'][] = ['beginner', 'intermediate', 'advanced'];

type StatusFilter = 'all' | 'passed' | 'locked' | 'available';

const selectCls =
  'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500';

function ChallengesPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  const reduxChallenges = useSelector((state: RootState) => state.challenges.challenges);
  const userId = user?.id || '';
  const passedIds = useSelector(selectPassedChallengeIds(userId));
  const challengeSummaries = useSelector(selectChallengeSummariesForUser(userId));

  const skipApi = !useGamificationApi || !user;
  const { data: challengesApi, isLoading: challengesApiLoading } = useGetGamificationChallengesQuery(undefined, {
    skip: skipApi,
  });

  const challenges: Challenge[] = useMemo(() => {
    if (!skipApi && challengesApi !== undefined) {
      return (challengesApi.challenges ?? []) as Challenge[];
    }
    return reduxChallenges;
  }, [skipApi, challengesApi, reduxChallenges]);

  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | Challenge['category']>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | Challenge['difficulty']>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const lockInfoById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof mergeApiOrLocalProgression>>();
    for (const c of challenges) {
      map.set(c.id, mergeApiOrLocalProgression(c, challenges, passedIds));
    }
    return map;
  }, [challenges, passedIds]);

  const filteredChallenges = useMemo(() => {
    const q = search.trim().toLowerCase();
    return challenges.filter((c) => {
      const lock = lockInfoById.get(c.id)!;
      const done = passedIds.has(c.id);

      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (difficultyFilter !== 'all' && c.difficulty !== difficultyFilter) return false;

      if (q) {
        const inTitle = c.title.toLowerCase().includes(q);
        const inDesc = (c.description || '').toLowerCase().includes(q);
        const inCat = categoryDisplayLabel(c.category).toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inCat) return false;
      }

      if (statusFilter === 'passed' && !done) return false;
      if (statusFilter === 'locked' && !lock.progressionLocked) return false;
      if (statusFilter === 'available' && (lock.progressionLocked || done)) return false;

      return true;
    });
  }, [challenges, lockInfoById, passedIds, categoryFilter, difficultyFilter, statusFilter, search]);

  const filtersActive =
    search.trim() !== '' || categoryFilter !== 'all' || difficultyFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setDifficultyFilter('all');
    setStatusFilter('all');
  };

  const passedKey = [...passedIds].sort().join(',');
  useEffect(() => {
    const focus = sessionStorage.getItem('practikal-focus-challenge');
    if (!focus || !challenges.some((c) => c.id === focus)) return;
    const ch = challenges.find((c) => c.id === focus)!;
    const { progressionLocked } = mergeApiOrLocalProgression(ch, challenges, passedIds);
    sessionStorage.removeItem('practikal-focus-challenge');
    if (!progressionLocked) setActiveChallenge(focus);
  }, [challenges, passedKey]);

  const difficultyColors = {
    beginner: 'bg-emerald-100 text-emerald-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800',
  };

  const handleChallengeComplete = () => {
    // Completion handled in ActiveChallenge / Redux
  };

  const currentChallenge = challenges.find((c) => c.id === activeChallenge);
  const currentLock = currentChallenge
    ? mergeApiOrLocalProgression(currentChallenge, challenges, passedIds)
    : null;
  const totalCh = challenges.length;
  const completedCount = passedIds.size;
  const overallPct = totalCh > 0 ? Math.round((completedCount / totalCh) * 100) : 0;

  if (currentChallenge && currentLock?.progressionLocked) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="max-w-md bg-white rounded-xl shadow-sm p-8 text-center border border-amber-100">
          <Lock className="mx-auto h-12 w-12 text-amber-600 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Challenge locked</h2>
          <p className="text-gray-600 text-sm mb-6">{currentLock.progressionLockReason}</p>
          <button
            type="button"
            onClick={() => setActiveChallenge(null)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Back to challenges
          </button>
        </div>
      </div>
    );
  }

  if (currentChallenge) {
    return (
      <ActiveChallenge
        challenge={currentChallenge}
        onComplete={handleChallengeComplete}
        onExit={() => setActiveChallenge(null)}
      />
    );
  }

  return (
    <div className="min-h-0 bg-gray-50">
      {/* Page header — matches app top bar (light + emerald accent) */}
      <div className="border-b border-emerald-100/90 bg-gradient-to-b from-emerald-50/45 via-white to-white">
        <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6 sm:py-3">
          <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
            <div className="min-w-0">
              <h1 className="text-base font-semibold tracking-tight text-emerald-950 sm:text-lg">Security Challenges</h1>
              <p className="text-[11px] text-emerald-800/75">
                Pass score {CHALLENGE_PASS_SCORE_PERCENT}%+ · XP from completed challenges
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2" aria-label="Challenges completion summary">
              <span className="tabular-nums text-sm font-semibold text-emerald-900">
                {completedCount}/{totalCh || '—'}
              </span>
              <span className="text-emerald-300" aria-hidden>
                ·
              </span>
              <span className="tabular-nums text-sm text-emerald-800/90">{totalCh > 0 ? `${overallPct}%` : '—'}</span>
            </div>
          </div>
          {totalCh > 0 && (
            <div className="mt-2.5">
              <div className="mb-1 flex justify-between text-[10px] font-medium uppercase tracking-wide text-emerald-800/70">
                <span>Progress</span>
                <span className="tabular-nums">{overallPct}%</span>
              </div>
              <div
                id="challenges-progress-bar"
                className="h-2 w-full overflow-hidden rounded-full bg-emerald-100/90"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={overallPct}
                aria-label={`${completedCount} of ${totalCh} challenges completed`}
              >
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all duration-500 ease-out"
                  style={{ width: `${overallPct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Topic tier prerequisites — expandable */}
      <div className="border-b border-emerald-100/70 bg-emerald-50/25">
        <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
          <details className="group rounded-lg border border-emerald-100/80 bg-white/60 text-emerald-950 shadow-sm open:shadow">
            <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs font-medium text-emerald-900 [&::-webkit-details-marker]:hidden">
              <Info className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              <span className="min-w-0 flex-1">
                Topic levels: <strong>Beginner</strong> → <strong>Intermediate</strong> → <strong>Advanced</strong>{' '}
                (prerequisites)
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-emerald-600 transition-transform group-open:rotate-180" />
            </summary>
            <div className="border-t border-emerald-100/80 px-3 py-2.5 text-[11px] leading-relaxed text-emerald-900/85">
              <p className="mb-2">
                Within each <strong>topic</strong> (e.g. Phishing, Password), harder levels stay{' '}
                <strong>locked</strong> until easier ones are done — only among challenges you can see.
              </p>
              <ul className="list-disc space-y-1 pl-4 marker:text-emerald-500">
                <li>
                  <strong>Intermediate</strong> unlocks after every visible <strong>Beginner</strong> challenge in
                  that topic is passed ({CHALLENGE_PASS_SCORE_PERCENT}%+ or pass).
                </li>
                <li>
                  <strong>Advanced</strong> unlocks after every visible <strong>Intermediate</strong> in that topic
                  is passed.
                </li>
                <li>If a topic has no beginner (or intermediate) challenges for you, that step is skipped.</li>
              </ul>
            </div>
          </details>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-14 z-[15] border-b border-emerald-100/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/85 sm:top-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-gray-500">
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
            <span>Filter challenges</span>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-emerald-700 hover:bg-emerald-50"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative min-w-0 flex-1 sm:min-w-[12rem] sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, topic, description…"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                aria-label="Search challenges"
              />
            </div>
            <select
              className={`${selectCls} min-w-0 flex-1 sm:w-40 sm:flex-none`}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
              aria-label="Filter by category"
            >
              <option value="all">All topics</option>
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryDisplayLabel(cat)}
                </option>
              ))}
            </select>
            <select
              className={`${selectCls} min-w-0 flex-1 sm:w-36 sm:flex-none`}
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as typeof difficultyFilter)}
              aria-label="Filter by difficulty"
            >
              <option value="all">All levels</option>
              {ALL_DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
            <select
              className={`${selectCls} min-w-0 flex-1 sm:w-40 sm:flex-none`}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="available">Available to start</option>
              <option value="passed">Passed</option>
              <option value="locked">Locked</option>
            </select>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Showing <span className="font-medium text-gray-700">{filteredChallenges.length}</span> of {totalCh}{' '}
            challenges
            {filtersActive ? ' (filters on)' : ''}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-6">
        {!skipApi && challengesApiLoading && challenges.length === 0 && (
          <p className="mb-4 text-sm text-gray-500">Loading challenges from server…</p>
        )}

        {filteredChallenges.length === 0 && !challengesApiLoading && (
          <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-600">
            No challenges match your filters.
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 block w-full text-emerald-600 hover:text-emerald-700 sm:mx-auto sm:w-auto"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
          {filteredChallenges.map((challenge) => {
            const done = passedIds.has(challenge.id);
            const { progressionLocked, progressionLockReason } = lockInfoById.get(challenge.id)!;
            const summary = challengeSummaries[challenge.id];
            const barPct = done ? 100 : summary?.bestScore ?? 0;
            const statusLabel = progressionLocked
              ? progressionLockReason || 'Locked'
              : done
                ? 'Passed'
                : summary?.attempts
                  ? `Best ${summary.bestScore}% · reach ${CHALLENGE_PASS_SCORE_PERCENT}% to pass`
                  : 'Not started';

            return (
              <div
                key={challenge.id}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (!progressionLocked) setActiveChallenge(challenge.id);
                  }
                }}
                className={`rounded-xl border bg-white p-5 shadow-sm transition-shadow ${
                  progressionLocked
                    ? 'cursor-not-allowed border-gray-100 opacity-80'
                    : 'cursor-pointer border-transparent hover:shadow-md'
                } ${done ? 'border-emerald-200 ring-1 ring-emerald-100/80' : ''}`}
                onClick={() => {
                  if (!progressionLocked) setActiveChallenge(challenge.id);
                }}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                    {categoryDisplayLabel(challenge.category)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColors[challenge.difficulty]}`}
                  >
                    {challenge.difficulty}
                  </span>
                  {progressionLocked && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {challenge.duration} min
                  </div>
                </div>

                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold leading-snug text-gray-900">{challenge.title}</h3>
                  {done && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Done
                    </span>
                  )}
                </div>
                <p className="mb-3 line-clamp-2 text-sm text-gray-600">{challenge.description}</p>

                <div className="mb-3">
                  <div className="mb-1 flex justify-between text-xs text-gray-500">
                    <span>Progress</span>
                    <span>{progressionLocked ? '—' : `${barPct}%`}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        progressionLocked ? 'bg-gray-200' : done ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${progressionLocked ? 0 : barPct}%` }}
                    />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-gray-500">{statusLabel}</p>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {challenge.xpReward} XP
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ChallengesPage;
