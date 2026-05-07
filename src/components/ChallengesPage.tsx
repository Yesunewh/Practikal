import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { selectPassedChallengeIds, selectChallengeSummariesForUser } from '../store/slices/progressSlice';
import {
  Search,
  SlidersHorizontal,
  X,
  Info,
  ChevronDown,
  Play,
  Lock,
  CheckCircle2,
  Star,
  Clock,
  Trophy,
  Target,
  Shield,
  Zap,
} from 'lucide-react';
import { mergeApiOrLocalProgression } from '../utils/challengeProgression';
import { CHALLENGE_PASS_SCORE_PERCENT, categoryDisplayLabel } from '../constants/challenges';
import ActiveChallenge from './ActiveChallenge';
import { useGetGamificationChallengesQuery, useGetCategoriesQuery, useGetDepartmentsQuery } from '../store/apiSlice/practikalApi';
import { useGamificationApi } from '../config/gamification';
import type { Challenge, Category } from '../types';
import { useI18n } from '../i18n/I18nContext';
import { interpolate } from '../i18n/messages';
import { PopularModulesCarousel } from './modules/PopularModulesCarousel';
import { ModuleCard } from './modules/ModuleCard';
import { getImageUrl } from '../utils/imageUtils';



const ALL_DIFFICULTIES: Challenge['difficulty'][] = ['beginner', 'intermediate', 'advanced'];

type StatusFilter = 'all' | 'passed' | 'locked' | 'available';

const selectCls =
  'rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all';

function ChallengesPage() {
  const { messages } = useI18n();
  const ch = messages.challenges;
  const com = messages.common;
  const user = useSelector((state: RootState) => state.auth.user);
  const reduxChallenges = useSelector((state: RootState) => state.challenges.challenges);
  const userId = user?.id || '';
  const passedIds = useSelector(selectPassedChallengeIds(userId));
  const challengeSummaries = useSelector(selectChallengeSummariesForUser(userId));

  const skipApi = !useGamificationApi || !user;
  const { data: challengesApi, isLoading: challengesApiLoading } = useGetGamificationChallengesQuery(undefined, {
    skip: skipApi,
  });

  const { data: categoriesApi } = useGetCategoriesQuery(undefined, {
    skip: skipApi,
  });
  const dbCategories = useMemo(() => categoriesApi?.categories || [], [categoriesApi]);

  const { data: departmentsData } = useGetDepartmentsQuery(user?.orgId || '', {
    skip: !user?.orgId,
  });
  const departments = useMemo(() => departmentsData?.departments || [], [departmentsData]);

  const canSelectDepartment = user?.user_type === 'SUPERADMIN' || user?.user_type === 'ORG_ADMIN';

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
  const [scopeFilter, setScopeFilter] = useState<'all' | 'global' | 'organization' | 'department'>('all');
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, categoryFilter, difficultyFilter, statusFilter, scopeFilter, selectedDeptId]);

  const lockInfoById = useMemo(() => {
    const map = new Map<string, ReturnType<typeof mergeApiOrLocalProgression>>();
    for (const c of challenges) {
      map.set(c.id, mergeApiOrLocalProgression(c, challenges, passedIds));
    }
    return map;
  }, [challenges, passedIds]);

  // Sort challenges by popularity (attemptCount)
  const sortedChallenges = useMemo(() => {
    return [...challenges].sort((a, b) => (b.attemptCount || 0) - (a.attemptCount || 0));
  }, [challenges]);

  const popularChallenges = useMemo(() => sortedChallenges.slice(0, 8), [sortedChallenges]);
  
  const recentChallenges = useMemo(() => {
    return [...challenges].sort((a, b) => {
      const dateA = a.releaseDate || a.createdAt || '';
      const dateB = b.releaseDate || b.createdAt || '';
      return dateB.localeCompare(dateA);
    }).slice(0, 8);
  }, [challenges]);

  const filteredChallenges = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedChallenges.filter((c) => {
      const lock = lockInfoById.get(c.id)!;
      const done = passedIds.has(c.id);

      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (difficultyFilter !== 'all' && c.difficulty !== difficultyFilter) return false;

      // Scope Filtering
      if (scopeFilter === 'global' && c.orgId) return false;
      if (scopeFilter === 'organization' && !c.orgId) return false;
      if (scopeFilter === 'department') {
        if (!c.deptId) return false;
        if (canSelectDepartment && selectedDeptId !== 'all' && c.deptId !== selectedDeptId) return false;
      }

      if (q) {
        const inTitle = c.title.toLowerCase().includes(q);
        const inDesc = (c.description || '').toLowerCase().includes(q);
        if (!inTitle && !inDesc) return false;
      }

      if (statusFilter === 'passed' && !done) return false;
      if (statusFilter === 'locked' && !lock.progressionLocked) return false;
      if (statusFilter === 'available' && (lock.progressionLocked || done)) return false;

      return true;
    });
  }, [sortedChallenges, lockInfoById, passedIds, categoryFilter, difficultyFilter, statusFilter, scopeFilter, selectedDeptId, search]);

  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(filteredChallenges.length / ITEMS_PER_PAGE);
  const paginatedChallenges = filteredChallenges.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const filtersActive =
    search.trim() !== '' || categoryFilter !== 'all' || difficultyFilter !== 'all' || statusFilter !== 'all' || scopeFilter !== 'all' || selectedDeptId !== 'all';

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setDifficultyFilter('all');
    setStatusFilter('all');
    setScopeFilter('all');
    setSelectedDeptId('all');
  };

  const currentChallenge = challenges.find((c) => c.id === activeChallenge);

  if (currentChallenge) {
    return (
      <ActiveChallenge
        challenge={currentChallenge}
        onComplete={() => { }}
        onExit={() => setActiveChallenge(null)}
      />
    );
  }

  const totalCh = challenges.length;
  const completedCount = passedIds.size;
  const overallPct = totalCh > 0 ? Math.round((completedCount / totalCh) * 100) : 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero / Header Section */}
      <div className="bg-neutral-50/50 border-b border-neutral-100">
        <div className="mx-auto max-w-7xl px-4 py-1 sm:px-6 lg:px-8">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl font-black tracking-tight text-neutral-900 sm:text-2xl leading-tight">
                {ch.pageTitle}
              </h1>
              <p className="text-xs text-neutral-500 font-medium hidden sm:block">
                {interpolate(ch.pageSubtitle, { pct: CHALLENGE_PASS_SCORE_PERCENT })}
              </p>
            </div>

            {/* Progress Summary Pill */}
            <div className="bg-white rounded-full py-1.5 px-3 shadow-sm border border-neutral-200 flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider leading-none mb-0.5">{com.progress}</div>
                <div className="text-sm font-black text-neutral-900 leading-none">
                  {completedCount} <span className="text-neutral-300 font-medium">/</span> {totalCh}
                </div>
              </div>
              <div className="hidden sm:block w-px h-6 bg-neutral-200" />
              <div className="relative h-8 w-8 flex-shrink-0">
                <svg className="h-full w-full transform -rotate-90">
                  <circle
                    cx="16" cy="16" r="14"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-neutral-100"
                  />
                  <circle
                    cx="16" cy="16" r="14"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={88}
                    strokeDashoffset={88 - (88 * overallPct) / 100}
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-900">
                  {overallPct}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 pt-2 sm:px-6 lg:px-8 space-y-2">

        {/* Filter Bar */}
        <div className="sticky top-2 z-30 space-y-1">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-neutral-200 p-1 shadow-xl shadow-neutral-200/20">
            <div className="flex flex-col lg:flex-row items-center gap-2">
              <div className="relative w-full lg:flex-1">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={ch.searchPlaceholder}
                  className="w-full rounded-xl border-none bg-neutral-100 py-3 pl-12 pr-4 text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <select
                  className={selectCls}
                  value={scopeFilter}
                  onChange={(e) => setScopeFilter(e.target.value as any)}
                >
                  <option value="all">All Scopes</option>
                  <option value="global">Global</option>
                  <option value="organization">Organization</option>
                  <option value="department">Department</option>
                </select>

                {scopeFilter === 'department' && canSelectDepartment && (
                  <select
                    className={selectCls}
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                )}

                <select
                  className={selectCls}
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
                >
                  <option value="all">{ch.allTopics || 'All Topics'}</option>
                  {dbCategories.map((cat: Category) => (
                    <option key={cat.id} value={cat.name}>{cat.display_name}</option>
                  ))}
                </select>

                <select
                  className={selectCls}
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value as any)}
                >
                  <option value="all">{ch.allLevels}</option>
                  {ALL_DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                </select>

                <select
                  className={selectCls}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                >
                  <option value="all">{ch.allStatuses}</option>
                  <option value="available">{ch.statusAvailable}</option>
                  <option value="passed">{ch.statusPassed}</option>
                </select>

                {filtersActive && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <X size={16} />
                    {com.clear}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Popular Modules Section */}
        {!filtersActive && (
          <PopularModulesCarousel
            title="Popular Modules"
            challenges={popularChallenges}
            passedIds={passedIds}
            lockInfoById={lockInfoById}
            onChallengeClick={setActiveChallenge}
            categories={dbCategories}
          />
        )}

        {/* Recent Modules Section */}
        {!filtersActive && (
          <PopularModulesCarousel
            title="Recent Modules"
            challenges={recentChallenges}
            passedIds={passedIds}
            lockInfoById={lockInfoById}
            onChallengeClick={setActiveChallenge}
            categories={dbCategories}
          />
        )}



        {/* Other Modules Grid */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-neutral-900">
              {filtersActive ? 'Search Results' : 'Other Modules'}
              <span className="ml-3 text-sm font-bold text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                {filteredChallenges.length}
              </span>
            </h2>
          </div>

          {filteredChallenges.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 rounded-3xl border-2 border-dashed border-neutral-100 bg-neutral-50/50">
              <div className="bg-white p-4 rounded-full shadow-sm text-neutral-300">
                <Search size={48} />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-neutral-900">{ch.noMatch}</p>
                <p className="text-sm text-neutral-400">Try adjusting your filters or search query.</p>
              </div>
              <button onClick={clearFilters} className="text-emerald-600 font-bold hover:underline">
                {ch.clearFilters}
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <div className="overflow-hidden rounded-2xl border border-neutral-200/60 bg-white shadow-sm ring-1 ring-black/5">
                    <table className="min-w-full divide-y divide-neutral-100">
                      <thead className="bg-neutral-50/50">
                        <tr>
                          <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            {ch.statusLabel || 'Status'}
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            {ch.moduleLabel || 'Module'}
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            {ch.rewardsLabel || 'Rewards'}
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            {ch.detailsLabel || 'Details'}
                          </th>
                          <th scope="col" className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            {ch.scopeLabel || 'Scope'}
                          </th>
                          <th scope="col" className="relative px-6 py-4">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100 bg-white">
                        {paginatedChallenges.map((challenge, idx) => {
                          const lock = lockInfoById.get(challenge.id);
                          const isDone = passedIds.has(challenge.id);
                          const isLocked = lock?.progressionLocked ?? false;
                          const category = dbCategories.find((cat: Category) => cat.name === challenge.category);
                          const catImg = category ? getImageUrl(category.image_url) : null;
                          
                          return (
                            <tr 
                              key={challenge.id} 
                              className={`group transition-all hover:bg-emerald-50/30 ${isLocked ? 'opacity-80' : ''}`}
                            >
                              <td className="whitespace-nowrap px-6 py-5">
                                <div className="flex items-center justify-center">
                                  {isDone ? (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm shadow-emerald-600/10">
                                      <CheckCircle2 size={18} strokeWidth={2.5} />
                                    </div>
                                  ) : isLocked ? (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 shadow-sm">
                                      <Lock size={18} strokeWidth={2.5} />
                                    </div>
                                  ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-sm shadow-blue-600/10 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                      <Play size={18} fill="currentColor" strokeWidth={2.5} className="ml-0.5" />
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-4">
                                  {catImg ? (
                                    <img 
                                      src={catImg} 
                                      alt="" 
                                      className="h-12 w-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" 
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-400">
                                      <Shield size={24} />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-black text-neutral-900">
                                      {challenge.title}
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                                      {category?.display_name || challenge.category}
                                      <span className="h-1 w-1 rounded-full bg-neutral-300" />
                                      {challenge.type}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-5">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg w-fit">
                                    <Zap size={12} fill="currentColor" />
                                    {challenge.xpReward} XP
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg w-fit">
                                    <Trophy size={12} fill="currentColor" />
                                    {challenge.reputationReward} REP
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-5">
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center gap-4">
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-neutral-500">
                                      <Clock size={13} className="text-neutral-400" />
                                      {challenge.duration}m
                                    </span>
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-neutral-500">
                                      <Star size={13} fill="currentColor" className="text-amber-400" />
                                      {(challenge.rating ?? 0).toFixed(1)}
                                    </span>
                                  </div>
                                  <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border ${
                                    challenge.difficulty === 'advanced' 
                                      ? 'bg-rose-50 text-rose-600 border-rose-100' 
                                      : challenge.difficulty === 'intermediate'
                                      ? 'bg-amber-50 text-amber-600 border-amber-100'
                                      : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  }`}>
                                    {challenge.difficulty}
                                  </span>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-6 py-5">
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold text-white shadow-sm transition-all ${
                                  !challenge.orgId ? 'bg-blue-500/90' : !challenge.deptId ? 'bg-indigo-500/90' : 'bg-purple-500/90'
                                }`}>
                                  <Shield className="h-3 w-3" />
                                  {!challenge.orgId ? 'Global' : !challenge.deptId ? 'Org' : 'Dept'}
                                </span>
                              </td>
                              <td className="whitespace-nowrap px-6 py-5 text-right">
                                <button
                                  type="button"
                                  onClick={() => !isLocked && setActiveChallenge(challenge.id)}
                                  disabled={isLocked}
                                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${
                                    isLocked
                                      ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                                      : isDone
                                      ? 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg shadow-neutral-900/10'
                                      : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                                  }`}
                                >
                                  {isLocked ? (
                                    <>
                                      <Lock size={12} />
                                      {ch.statusLockedShort || 'Locked'}
                                    </>
                                  ) : isDone ? (
                                    'Review'
                                  ) : (
                                    'Start'
                                  )}
                                </button>
                                {isLocked && lock?.progressionLockReason && (
                                  <div className="absolute right-6 mt-1 hidden group-hover:block z-20">
                                    <div className="bg-neutral-900 text-white text-[10px] p-2 rounded-lg shadow-xl border border-white/10 animate-in fade-in slide-in-from-top-1 max-w-[150px]">
                                      {lock.progressionLockReason}
                                    </div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-neutral-100">
                <div className="text-sm text-neutral-500 font-medium">
                  Showing <span className="text-neutral-900">{paginatedChallenges.length}</span> of <span className="text-neutral-900">{filteredChallenges.length}</span> challenges
                </div>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Previous
                  </button>
                  <div className="flex items-center px-4 text-sm font-bold text-neutral-700 bg-neutral-50 rounded-xl">
                    {currentPage} / {totalPages || 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages || 1, p + 1))}
                    disabled={currentPage === (totalPages || 1)}
                    className="px-5 py-2.5 rounded-xl border border-neutral-200 bg-white text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

export default ChallengesPage;
