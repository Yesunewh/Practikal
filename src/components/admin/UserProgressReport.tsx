import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { User } from '../../types';
import {
  Activity,
  Download,
  Filter,
  Loader2,
  Search,
  Trophy,
  BarChart3,
} from 'lucide-react';
import { RootState } from '../../store';
import { selectUserProgress } from '../../store/slices/progressSlice';
import { downloadCsv } from '../../utils/csv';
import { useGetUsersQuery, useGetGamificationChallengesQuery, useGetDepartmentsQuery } from '../../store/apiSlice/practikalApi';
import { useGamificationApi } from '../../config/gamification';
import { useReportScopeArgs } from '../../hooks/useReportScopeArgs';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate, reportScopeSubtitle, type Messages } from '../../i18n/messages';

function reportUserTypeLabel(raw: string | null | undefined, a: Messages['admin']): string {
  if (raw == null || String(raw).trim() === '') return a.dash;
  switch (String(raw).toUpperCase()) {
    case 'STAFF':
      return a.reportRoleSTAFF;
    case 'EXTERNAL':
      return a.reportRoleEXTERNAL;
    case 'ORG_ADMIN':
      return a.reportRoleORG_ADMIN;
    case 'UNIT_ADMIN':
      return a.reportRoleUNIT_ADMIN;
    case 'DEPT_ADMIN':
      return a.reportRoleDEPT_ADMIN;
    case 'SUPERADMIN':
      return a.reportRoleSUPERADMIN;
    default:
      return String(raw);
  }
}

function reportStatusLabel(raw: string | null | undefined, a: Messages['admin']): string {
  const u = String(raw || 'ACTIVE').toUpperCase();
  if (u === 'ACTIVE') return a.filterStatusActive;
  if (u === 'INACTIVE') return a.filterStatusInactive;
  if (u === 'UNASSIGNED') return a.filterStatusUnassigned;
  return u;
}

function challengeTopicLabel(
  slug: string,
  cc: Messages['admin']['challengesHub']['createChallenge'],
): string {
  const m: Record<string, string> = {
    general: cc.catGeneral,
    phishing: cc.catPhishing,
    malware: cc.catMalware,
    password: cc.catPassword,
    'social-engineering': cc.catSocialEng,
    'incident-response': cc.catIncident,
  };
  if (m[slug]) return m[slug];
  return slug.replace(/-/g, ' ');
}

interface UserProgressReportProps {
  currentUser: User;
}

type RosterRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  email?: string | null;
  status?: string;
  user_type?: string;
  org_id?: string | null;
  dept_id?: string | null;
  unit_id?: string | null;
  gamification_xp?: number;
  gamification_level?: string;
  gamification_xp_to_next?: number;
  gamification_reputation?: number;
  gamification_streak?: number;
  gamification_longest_streak?: number;
  gamification_last_activity?: string | null;
  passed_challenge_count?: number;
  Organization?: { id: string; name: string } | null;
  Department?: { id: string; name: string } | null;
};

export default function UserProgressReport({ currentUser }: UserProgressReportProps) {
  const state = useSelector((s: RootState) => s);
  const reduxChallenges = useSelector((s: RootState) => s.challenges.challenges);
  const { messages, locale } = useI18n();
  const cc = messages.admin.challengesHub.createChallenge;

  const {
    isDeptAdmin,
    isUnitAdmin,
    usersQueryArg,
    skipUsersQuery,
    challengesQueryArg,
    scopeKind,
  } = useReportScopeArgs(currentUser);

  const scopeSubtitle = useMemo(
    () => reportScopeSubtitle(scopeKind, messages.admin),
    [scopeKind, messages.admin],
  );

  const a = messages.admin;

  const { data: usersData, isLoading: loadingUsers, isError: usersError } = useGetUsersQuery(usersQueryArg, {
    skip: skipUsersQuery,
  });
  const rawRoster: RosterRow[] = usersData?.users ?? [];

  const { data: deptsRes } = useGetDepartmentsQuery(currentUser.orgId || '', {
    skip: !currentUser.orgId || isDeptAdmin,
  });
  const deptNameById = useMemo(() => {
    const m = new Map<string, string>();
    const list = deptsRes?.depts ?? [];
    list.forEach((d: { id: string; name: string }) => m.set(d.id, d.name));
    return m;
  }, [deptsRes?.depts]);

  const challengesQueryArgForApi = useMemo(() => {
    if (!useGamificationApi) return undefined;
    return challengesQueryArg;
  }, [useGamificationApi, challengesQueryArg]);

  const { data: challengesRes, isFetching: loadingChallenges } = useGetGamificationChallengesQuery(
    challengesQueryArgForApi,
    {
      skip: !useGamificationApi,
    },
  );

  const apiChallengeCount = challengesRes?.challenges?.length ?? 0;
  const totalChallengesDenominator = useMemo(() => {
    const n = useGamificationApi ? apiChallengeCount : reduxChallenges.filter((c) => c.id).length;
    return Math.max(n, 1);
  }, [useGamificationApi, apiChallengeCount, reduxChallenges]);

  const challengesForProgress = useGamificationApi
    ? (challengesRes?.challenges as typeof reduxChallenges | undefined) ?? reduxChallenges
    : reduxChallenges;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'progress' | 'xp' | 'streak' | 'name'>('progress');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');

  const passedCount = (u: RosterRow) => Number(u.passed_challenge_count ?? 0);

  const completionPct = (u: RosterRow) =>
    Math.min(100, Math.round((passedCount(u) / totalChallengesDenominator) * 100));

  const filteredRoster = useMemo(() => {
    return rawRoster.filter((u) => {
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const email = String(u.email ?? '').toLowerCase();
        const phone = String(u.phone_number ?? '');
        if (!fullName.includes(q) && !email.includes(q) && !phone.includes(q)) return false;
      }
      if (statusFilter !== 'all') {
        const st = (u.status || 'ACTIVE').toUpperCase();
        if (st !== statusFilter.toUpperCase()) return false;
      }
      if (deptFilter !== 'all' && u.dept_id !== deptFilter) return false;
      return true;
    });
  }, [rawRoster, searchQuery, statusFilter, deptFilter]);

  const sortedRoster = useMemo(() => {
    const list = [...filteredRoster];
    list.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
        case 'xp':
          return (b.gamification_xp ?? 0) - (a.gamification_xp ?? 0);
        case 'streak':
          return (b.gamification_streak ?? 0) - (a.gamification_streak ?? 0);
        case 'progress':
        default:
          return completionPct(b) - completionPct(a);
      }
    });
    return list;
  }, [filteredRoster, sortBy, totalChallengesDenominator]);

  const selectedRow = selectedUserId ? rawRoster.find((u) => u.user_id === selectedUserId) ?? null : null;

  const isSelfSelected = selectedRow != null && selectedRow.user_id === currentUser.id;
  const liveProgress = isSelfSelected ? selectUserProgress(currentUser.id, challengesForProgress)(state) : null;

  const exportRosterCsv = () => {
    const rows = sortedRoster.map((u) => {
      const orgName = u.Organization?.name ?? '';
      const deptName = u.Department?.name ?? (u.dept_id ? deptNameById.get(u.dept_id) ?? '' : '');
      return [
        u.user_id,
        `${u.first_name} ${u.last_name}`.trim(),
        u.email ?? '',
        u.phone_number ?? '',
        u.status ?? 'ACTIVE',
        u.user_type ?? '',
        orgName,
        deptName,
        u.unit_id ?? '',
        String(u.gamification_xp ?? 0),
        u.gamification_level ?? '',
        String(u.gamification_reputation ?? 0),
        String(u.gamification_streak ?? 0),
        String(passedCount(u)),
        String(completionPct(u)),
        u.gamification_last_activity ?? '',
      ];
    });
    downloadCsv(
      [
        'userId',
        'fullName',
        'email',
        'phone',
        'status',
        'userType',
        'organization',
        'department',
        'unitId',
        'xp',
        'level',
        'reputation',
        'streak',
        'challengesPassed',
        'completionPercent',
        'lastActivityDate',
      ],
      rows,
      a.rosterCsvFilename,
    );
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0
      ? interpolate(a.reportTimeHoursMins, { hours, mins })
      : interpolate(a.reportTimeMinsOnly, { mins });
  };

  if (skipUsersQuery) {
    return (
      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-6 text-amber-900">
        <p className="font-semibold">{a.rosterUnavailableTitle}</p>
        <p className="mt-1 text-sm text-amber-800/90">
          {isDeptAdmin
            ? a.rosterUnavailableDept
            : isUnitAdmin
              ? a.rosterUnavailableUnit
              : a.rosterUnavailableOrg}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3 text-white">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <BarChart3 className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">{messages.nav.items.adminReports}</h2>
                <p className="text-sm text-emerald-50/90">
                  {scopeSubtitle}
                  {useGamificationApi && loadingChallenges ? a.loadingCatalog : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={exportRosterCsv}
              disabled={sortedRoster.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={18} aria-hidden />
              {a.exportRosterCsv}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 sm:p-5">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={a.searchRosterPlaceholder}
              className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pl-10 pr-3 text-sm outline-none ring-emerald-500/30 transition focus:border-emerald-500 focus:bg-white focus:ring-2"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter size={16} className="hidden text-gray-500 sm:block" aria-hidden />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
            >
              <option value="progress">{a.sortCompletion}</option>
              <option value="xp">{a.sortXp}</option>
              <option value="streak">{a.sortStreak}</option>
              <option value="name">{a.sortName}</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
            >
              <option value="all">{a.filterAllStatuses}</option>
              <option value="ACTIVE">{a.filterStatusActive}</option>
              <option value="INACTIVE">{a.filterStatusInactive}</option>
              <option value="UNASSIGNED">{a.filterStatusUnassigned}</option>
            </select>

            {!isDeptAdmin && currentUser.orgId && (deptsRes?.depts?.length ?? 0) > 0 && (
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500/30 focus:border-emerald-500 focus:ring-2"
              >
                <option value="all">{a.filterAllDepartments}</option>
                {(deptsRes?.depts ?? []).map((d: { id: string; name: string }) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {!useGamificationApi && (
          <p className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            {a.gamificationApiOffBanner}
          </p>
        )}
      </div>

      {usersError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800">
          {a.usersLoadError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="space-y-3 lg:col-span-1">
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white py-16 text-gray-500 shadow-sm">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" aria-hidden />
              <p className="text-sm font-medium">{a.loadingRoster}</p>
            </div>
          ) : sortedRoster.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center text-gray-600 shadow-sm">
              <Activity className="mx-auto mb-3 h-10 w-10 text-gray-300" aria-hidden />
              <p className="font-semibold text-gray-900">{a.noPeopleMatch}</p>
              <p className="mt-1 text-sm">{a.noPeopleMatchHint}</p>
            </div>
          ) : (
            <div className="max-h-[min(680px,75vh)] space-y-2 overflow-y-auto pr-1.5 thin-scrollbar">
              {sortedRoster.map((user) => {
                const pct = completionPct(user);
                const selected = selectedUserId === user.user_id;
                const deptLabel =
                  user.Department?.name ??
                  (user.dept_id ? deptNameById.get(user.dept_id) : null) ??
                  user.dept_id?.slice(0, 8);

                return (
                  <button
                    type="button"
                    key={user.user_id}
                    onClick={() => setSelectedUserId(user.user_id)}
                    className={`w-full rounded-2xl border-2 p-3 text-left transition ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-md'
                        : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                        {(user.first_name?.[0] ?? '?').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-semibold text-gray-900">
                          {user.first_name} {user.last_name}
                        </h3>
                        <p className="truncate text-xs text-gray-500">
                          {user.Organization?.name ?? ''}
                          {deptLabel ? ` · ${deptLabel}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 font-medium">{a.rosterCardCompletion}:</span>
                        <span className="font-semibold text-emerald-700">{pct}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 font-medium">XP:</span>
                        <span className="font-semibold text-sky-700">{user.gamification_xp ?? 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 font-medium">{a.rosterCardPassed}:</span>
                        <span className="font-semibold text-violet-700">{passedCount(user)}/{totalChallengesDenominator}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 font-medium">{a.rosterCardStreak}:</span>
                        <span className="font-semibold text-orange-700">{user.gamification_streak ?? 0}d</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {!selectedRow ? (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm">
              <Activity className="mb-4 h-14 w-14 text-gray-200" aria-hidden />
              <h3 className="text-lg font-bold text-gray-900">{a.selectSomeone}</h3>
              <p className="mt-2 max-w-md text-sm text-gray-600">{a.selectSomeoneHint}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-bold">
                    {(selectedRow.first_name?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {selectedRow.first_name} {selectedRow.last_name}
                    </h2>
                    <p className="text-sm text-emerald-50/95">
                      {selectedRow.email?.trim() || a.noEmailOnFile} ·{' '}
                      {reportUserTypeLabel(selectedRow.user_type, a)}
                    </p>
                    <p className="mt-1 text-xs text-emerald-100/90">
                      {reportStatusLabel(selectedRow.status, a)}
                      {selectedRow.Organization?.name ? ` · ${selectedRow.Organization.name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
                  <div className="rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/90">
                      {a.levelLabel}
                    </p>
                    <p className="text-lg font-bold capitalize">{selectedRow.gamification_level ?? a.dash}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/90">
                      {a.rosterCardXp}
                    </p>
                    <p className="text-lg font-bold">{selectedRow.gamification_xp ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/90">
                      {a.reputationLabel}
                    </p>
                    <p className="text-lg font-bold">{selectedRow.gamification_reputation ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/90">
                      {a.rosterCardStreak}
                    </p>
                    <p className="text-lg font-bold">
                      {interpolate(a.reportDaySuffix, { n: selectedRow.gamification_streak ?? 0 })}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/90">
                      {a.rosterCardPassed}
                    </p>
                    <p className="text-lg font-bold">
                      {passedCount(selectedRow)}/{totalChallengesDenominator}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/10 px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-100/90">
                      {a.rosterCardCompletion}
                    </p>
                    <p className="text-lg font-bold">{completionPct(selectedRow)}%</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-gray-900">
                  <Trophy className="h-5 w-5 text-emerald-600" aria-hidden />
                  {a.trainingSummary}
                </h3>
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-4 rounded-xl bg-gray-50 px-3 py-2">
                    <dt className="text-gray-600">{a.longestStreak}</dt>
                    <dd className="font-semibold text-gray-900">
                      {interpolate(a.reportDaySuffix, { n: selectedRow.gamification_longest_streak ?? 0 })}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 rounded-xl bg-gray-50 px-3 py-2">
                    <dt className="text-gray-600">{a.lastActivityServer}</dt>
                    <dd className="font-semibold text-gray-900">
                      {selectedRow.gamification_last_activity
                        ? new Date(selectedRow.gamification_last_activity).toLocaleDateString(
                            locale === 'en' ? undefined : locale,
                          )
                        : a.dash}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 rounded-xl bg-gray-50 px-3 py-2 sm:col-span-2">
                    <dt className="text-gray-600">{a.challengesInCatalogScope}</dt>
                    <dd className="font-semibold text-gray-900">{totalChallengesDenominator}</dd>
                  </div>
                </dl>
                {!isSelfSelected && (
                  <p className="mt-4 rounded-xl border border-sky-100 bg-sky-50/80 px-3 py-2 text-xs text-sky-900">
                    {a.otherUserChartsNote}
                  </p>
                )}
              </div>

              {isSelfSelected && liveProgress && (
                <>
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-4 text-base font-bold text-gray-900">{a.categoryProgressThisDevice}</h3>
                    <div className="space-y-3">
                      {liveProgress.categoryProgress.map((cat) => (
                        <div key={cat.category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-semibold capitalize text-gray-700">
                              {challengeTopicLabel(cat.category, cc)}
                            </span>
                            <span className="text-gray-600">
                              {interpolate(a.categoryProgressLine, {
                                completed: cat.completed,
                                total: cat.total,
                                score: cat.averageScore,
                              })}
                            </span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200">
                            <div
                              className="h-2 rounded-full bg-emerald-600 transition-all"
                              style={{ width: `${cat.total ? (cat.completed / cat.total) * 100 : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <h3 className="mb-3 text-base font-bold text-gray-900">{a.sessionStatsThisDevice}</h3>
                    <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                      <div>
                        <dt className="text-gray-500">{a.statAvgScore}</dt>
                        <dd className="text-lg font-bold text-gray-900">{liveProgress.averageScore}%</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{a.statTimeCompleted}</dt>
                        <dd className="text-lg font-bold text-gray-900">{formatTime(liveProgress.totalTimeSpent)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{a.statCurrentStreak}</dt>
                        <dd className="text-lg font-bold text-gray-900">
                          {interpolate(a.reportDaySuffix, { n: liveProgress.currentStreak })}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-gray-500">{a.statRiskProxy}</dt>
                        <dd className="text-lg font-bold text-gray-900">
                          {Math.min(100, Math.max(0, 100 - liveProgress.averageScore))}%
                        </dd>
                      </div>
                    </dl>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
