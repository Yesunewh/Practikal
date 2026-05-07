import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nContext';
import { interpolate } from '../../i18n/messages';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
} from 'recharts';
import { User } from '../../types';
import {
  Loader2,
  Trophy,
  Search,
  Bell,
  Download,
  Target,
  Timer,
  Users,
  Award,
  ChevronDown,
} from 'lucide-react';
import {
  useGetUsersQuery,
  useGetGamificationChallengesQuery,
  useGetGamificationAdminTrainingSummaryQuery,
} from '../../store/apiSlice/practikalApi';
import { useGamificationApi } from '../../config/gamification';
import { useReportScopeArgs } from '../../hooks/useReportScopeArgs';
import { downloadCsv } from '../../utils/csv';

type RosterRow = {
  user_id: string;
  first_name: string;
  last_name: string;
  status?: string;
  org_id?: string | null;
  dept_id?: string | null;
  unit_id?: string | null;
  gamification_xp?: number;
  gamification_streak?: number;
  passed_challenge_count?: number;
  Department?: { id: string; name: string } | null;
};

interface TrainingSummaryDashboardProps {
  currentUser: User;
}

const CHART_EMERALD = '#059669';
const CHART_EMERALD_LIGHT = '#34d399';
const CHART_AMBER = '#d97706';
const TEAL_PRIMARY = '#0f4d40';

function formatCategoryLabel(cat: string) {
  return cat.replace(/-/g, ' ');
}

function truncateLabel(s: string, max = 16) {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

type KpiStatCardProps = {
  label: string;
  icon: ReactNode;
  iconWrapClass: string;
  value: ReactNode;
};

function KpiStatCard({ label, icon, iconWrapClass, value }: KpiStatCardProps) {
  return (
    <article className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-neutral-200/80 bg-white p-2.5 shadow-sm ring-1 ring-neutral-950/[0.04] sm:p-3.5 md:p-4">
      {/* Title + icon: single row, no wrap; title truncates with native tooltip */}
      <div className="flex min-w-0 flex-nowrap items-center justify-between gap-1.5 sm:gap-2">
        <p
          className="min-w-0 flex-1 truncate text-[8px] font-semibold uppercase leading-tight tracking-tight text-neutral-500 min-[360px]:text-[9px] min-[360px]:tracking-normal sm:text-[10px] sm:leading-snug sm:tracking-wide md:text-[11px] lg:text-xs"
          title={label}
        >
          {label}
        </p>
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg sm:h-8 sm:w-8 sm:rounded-xl md:h-9 md:w-9 [&_svg]:size-3 min-[360px]:[&_svg]:size-3.5 sm:[&_svg]:size-4 ${iconWrapClass}`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-2 min-w-0 sm:mt-2.5 md:mt-3">
        <p className="break-words text-lg font-bold tabular-nums leading-none tracking-tight text-neutral-900 min-[360px]:text-xl sm:text-2xl md:text-3xl">
          {value}
        </p>
      </div>
    </article>
  );
}

function heatCellClass(pct: number): string {
  if (pct < 40) return 'bg-emerald-100';
  if (pct < 60) return 'bg-emerald-300';
  if (pct < 80) return 'bg-emerald-500';
  return 'bg-emerald-800';
}

export default function TrainingSummaryDashboard({ currentUser }: TrainingSummaryDashboardProps) {
  const { messages } = useI18n();
  const {
    usersQueryArg,
    skipUsersQuery,
    challengesQueryArg,
    trainingSummaryQueryArg,
  } = useReportScopeArgs(currentUser);

  const [search, setSearch] = useState('');
  const [accelerationPeriod, setAccelerationPeriod] = useState<'week' | 'month'>('week');

  const challengesQueryArgForApi = useMemo(() => {
    if (!useGamificationApi) return undefined;
    return challengesQueryArg;
  }, [challengesQueryArg]);

  const { data: usersData, isLoading: loadingUsers } = useGetUsersQuery(usersQueryArg, {
    skip: skipUsersQuery,
  });
  const rawRoster = useMemo(() => (usersData?.users ?? []) as RosterRow[], [usersData?.users]);

  const { data: challengesRes } = useGetGamificationChallengesQuery(challengesQueryArgForApi, {
    skip: !useGamificationApi,
  });
  const catalogCount = Math.max(challengesRes?.challenges?.length ?? 0, 1);

  const { data: summaryRes, isFetching: loadingSummary } = useGetGamificationAdminTrainingSummaryQuery(
    trainingSummaryQueryArg,
    {
      skip: !useGamificationApi || skipUsersQuery,
    },
  );
  const summary = summaryRes?.summary;

  const rosterStats = useMemo(() => {
    const deptFb = messages.admin.deptFallback;
    const n = rawRoster.length;
    if (n === 0) {
      return { avgCompletion: 0, active: 0, inactive: 0, byDept: [] as { id: string; name: string; count: number }[] };
    }
    let sumPct = 0;
    let active = 0;
    let inactive = 0;
    const deptMap = new Map<string, { name: string; count: number }>();
    for (const u of rawRoster) {
      const passed = Number(u.passed_challenge_count ?? 0);
      const pct = Math.min(100, Math.round((passed / catalogCount) * 100));
      sumPct += pct;
      const st = (u.status || 'ACTIVE').toUpperCase();
      if (st === 'ACTIVE') active += 1;
      else inactive += 1;
      const did = u.dept_id;
      if (did) {
        const name = u.Department?.name ?? deptFb;
        const prev = deptMap.get(did) ?? { name, count: 0 };
        deptMap.set(did, { name: u.Department?.name ?? prev.name, count: prev.count + 1 });
      }
    }
    const byDept = [...deptMap.entries()].map(([id, v]) => ({ id, name: v.name, count: v.count }));
    byDept.sort((a, b) => b.count - a.count);
    return { avgCompletion: Math.round(sumPct / n), active, inactive, byDept };
  }, [rawRoster, catalogCount, messages.admin.deptFallback]);

  const categoryChartData = useMemo(() => {
    if (!summary?.categories?.length) return [];
    const denom = Math.max(summary.userCount || 1, 1);
    return summary.categories.map((c) => ({
      name: formatCategoryLabel(c.category),
      key: c.category,
      learners: c.usersWithPass,
      pct: Math.round((c.usersWithPass / denom) * 100),
    }));
  }, [summary]);

  const query = search.trim().toLowerCase();
  const filteredCategories = useMemo(() => {
    if (!query) return categoryChartData;
    return categoryChartData.filter((c) => c.name.toLowerCase().includes(query));
  }, [categoryChartData, query]);

  const deptChartData = useMemo(() => {
    return rosterStats.byDept.slice(0, 12).map((d) => ({
      name: d.name,
      count: d.count,
    }));
  }, [rosterStats.byDept]);
  const filteredDeptChartData = useMemo(() => {
    if (!query) return deptChartData;
    return deptChartData.filter((d) => d.name.toLowerCase().includes(query));
  }, [deptChartData, query]);

  const challengerBarData = useMemo(() => {
    if (!summary?.topChallengers?.length) return [];
    return summary.topChallengers.slice(0, 8).map((row) => ({
      name: row.name,
      xp: row.xp,
      completed: row.challengesCompleted,
    }));
  }, [summary]);
  const filteredChallengerBarData = useMemo(() => {
    if (!query) return challengerBarData;
    return challengerBarData.filter((c) => c.name.toLowerCase().includes(query));
  }, [challengerBarData, query]);

  const weakestCategory =
    summary?.categories && summary.categories.length > 1
      ? summary.categories[summary.categories.length - 1]
      : null;

  const showChartSkeleton = loadingUsers && rawRoster.length === 0;
  const hasPeople = (summary?.userCount ?? rawRoster.length) > 0;
  const totalUsersScope = summary?.userCount ?? rawRoster.length;

  const a = messages.admin;

  const highestCompletion = useMemo(
    () =>
      rawRoster.length
        ? rawRoster.reduce(
            (m, u) =>
              Math.max(m, Math.min(100, Math.round((Number(u.passed_challenge_count ?? 0) / catalogCount) * 100))),
            0,
          )
        : 0,
    [rawRoster, catalogCount],
  );

  const accelerationRows = useMemo(() => {
    const sorted = [...categoryChartData].sort((x, y) => x.pct - y.pct).slice(0, 4);
    const priorities = ['urgent', 'high', 'medium', 'low'] as const;
    return sorted.map((row, i) => ({
      priority: priorities[Math.min(i, priorities.length - 1)],
      focus: row.name,
      status: interpolate(a.accelerationStatusLine, { pct: row.pct }),
      action:
        row.pct < 40
          ? a.actionPeerMentoring
          : row.pct < 60
            ? a.actionReview
            : row.pct < 75
              ? a.actionLabs
              : a.actionCheatSheet,
      impact: interpolate(a.impactGain, { n: Math.min(35, Math.max(5, 100 - row.pct)) }),
      passRate: row.pct,
      learners: row.learners,
    }));
  }, [categoryChartData, a]);
  const filteredAccelerationRows = useMemo(() => {
    if (!query) return accelerationRows;
    return accelerationRows.filter(
      (r) =>
        r.focus.toLowerCase().includes(query) ||
        r.status.toLowerCase().includes(query) ||
        r.action.toLowerCase().includes(query),
    );
  }, [accelerationRows, query]);

  const lineGrowthData = useMemo(() => {
    if (challengerBarData.length >= 2) {
      return challengerBarData.slice(0, 3).map((row, idx) => ({
        attempt: row.name,
        score: Math.min(100, Math.round((row.completed / Math.max(catalogCount, 1)) * 100)),
        rank: idx + 1,
      }));
    }
    return [
      { attempt: a.growthAttempt1, score: Math.max(0, Math.min(100, rosterStats.avgCompletion - 10)), rank: 1 },
      { attempt: a.growthAttempt2, score: rosterStats.avgCompletion, rank: 2 },
      { attempt: a.growthAttempt3, score: highestCompletion, rank: 3 },
    ];
  }, [challengerBarData, catalogCount, a, rosterStats.avgCompletion, highestCompletion]);

  const questionMix = useMemo(() => {
    const categories = summary?.categories ?? [];
    if (!categories.length || !summary?.userCount) {
      return {
        easyShare: 0,
        midShare: 0,
        hardShare: 0,
        easyCorrect: 0,
        midCorrect: 0,
        hardCorrect: 0,
      };
    }
    let easyAttempts = 0;
    let midAttempts = 0;
    let hardAttempts = 0;
    let easyScoreSum = 0;
    let midScoreSum = 0;
    let hardScoreSum = 0;
    const totalAttempts = Math.max(
      1,
      categories.reduce((acc, c) => acc + Number(c.passAttempts ?? 0), 0),
    );
    for (const c of categories) {
      const attempts = Math.max(0, Number(c.passAttempts ?? 0));
      const passRate = Math.min(
        100,
        Math.max(0, Math.round((Number(c.usersWithPass ?? 0) / Math.max(summary.userCount, 1)) * 100)),
      );
      if (passRate >= 70) {
        easyAttempts += attempts;
        easyScoreSum += passRate * attempts;
      } else if (passRate >= 40) {
        midAttempts += attempts;
        midScoreSum += passRate * attempts;
      } else {
        hardAttempts += attempts;
        hardScoreSum += passRate * attempts;
      }
    }
    const easyShare = Math.round((easyAttempts / totalAttempts) * 100);
    const midShare = Math.round((midAttempts / totalAttempts) * 100);
    const hardShare = Math.max(0, 100 - easyShare - midShare);
    return {
      easyShare,
      midShare,
      hardShare,
      easyCorrect: easyAttempts > 0 ? Math.round(easyScoreSum / easyAttempts) : 0,
      midCorrect: midAttempts > 0 ? Math.round(midScoreSum / midAttempts) : 0,
      hardCorrect: hardAttempts > 0 ? Math.round(hardScoreSum / hardAttempts) : 0,
    };
  }, [summary]);

  const weakTopicPassPct = weakestCategory
    ? Math.round((weakestCategory.usersWithPass / Math.max(summary?.userCount || 1, 1)) * 100)
    : 0;
  const growthDelta = lineGrowthData.length > 1
    ? lineGrowthData[lineGrowthData.length - 1].score - lineGrowthData[0].score
    : 0;

  if (skipUsersQuery) {
    return null;
  }

  const topPerformer = summary?.topChallengers?.[0];
  const maxXp = summary?.topChallengers?.length
    ? Math.max(...summary.topChallengers.map((r) => r.xp || 0), 1)
    : 1;
  const topScoreDisplay = topPerformer
    ? `${Math.min(100, Math.round(((topPerformer.xp ?? 0) / maxXp) * 100))}/100`
    : a.dash;

  const totalExamLikeCount =
    summary?.categories?.reduce((acc, cRow) => acc + Number(cRow.passAttempts ?? 0), 0) ??
    summary?.topChallengers?.reduce((acc, row) => acc + Number(row.challengesCompleted ?? 0), 0) ??
    0;

  const exportOverviewCsv = () => {
    const rows: string[][] = [];
    rows.push(['summary', 'avgCompletionPct', String(rosterStats.avgCompletion), '']);
    rows.push(['summary', 'highestCompletionPct', String(highestCompletion), '']);
    rows.push(['summary', 'totalAnalyzed', String(totalExamLikeCount), '']);
    filteredCategories.forEach((c) => {
      rows.push(['category', c.name, String(c.pct), String(c.learners)]);
    });
    filteredChallengerBarData.forEach((c) => {
      rows.push(['topChallenger', c.name, String(c.xp), String(c.completed)]);
    });
    downloadCsv(
      ['rowType', 'label', 'value1', 'value2'],
      rows,
      'admin-overview-report.csv',
    );
  };

  return (
    <div className="space-y-6 rounded-2xl bg-[#f4f6f5] p-4 sm:p-6">
      {/* Header — Results & Analytics */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{a.resultsAnalyticsTitle}</h1>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end lg:max-w-2xl">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={a.reportSearchPlaceholder}
              className="w-full rounded-2xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 shadow-sm placeholder:text-neutral-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50"
              aria-label={a.notificationsAria}
            >
              <Bell className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={exportOverviewCsv}
              className="inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              style={{ backgroundColor: TEAL_PRIMARY }}
            >
              <Download className="h-4 w-4" />
              {a.exportReport}
            </button>
          </div>
        </div>
      </header>

      {/* KPI strip — 1 col → 2 → 3 → 5 */}
      <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiStatCard
          label={a.avgCompletion}
          icon={<Target aria-hidden />}
          iconWrapClass="bg-emerald-50 text-emerald-700"
          value={`${rosterStats.avgCompletion}%`}
        />
        <KpiStatCard
          label={a.highestScoreCard}
          icon={<Award aria-hidden />}
          iconWrapClass="bg-teal-50 text-teal-800"
          value={`${highestCompletion}%`}
        />
        <KpiStatCard
          label={a.totalAnalyzedCard}
          icon={<Users aria-hidden />}
          iconWrapClass="bg-sky-50 text-sky-800"
          value={totalExamLikeCount}
        />
        <KpiStatCard
          label={a.averageTimeCard}
          icon={<Timer aria-hidden />}
          iconWrapClass="bg-amber-50 text-amber-800"
          value={<span className="tabular-nums">{a.dash}</span>}
        />
        <KpiStatCard
          label={a.topPerformerCard}
          icon={<Trophy aria-hidden />}
          iconWrapClass="bg-violet-50 text-violet-800"
          value={<span className="tabular-nums">{topScoreDisplay}</span>}
        />
      </div>

      {showChartSkeleton ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <div className="h-[360px] w-full animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ) : (
        <>
          {/* Heatmap + question-level */}
          <div className="grid gap-4 lg:grid-cols-12">
            <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5 lg:col-span-7">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-neutral-900 sm:text-lg">{a.heatmapTitle}</h2>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {a.heatmapAggregateOnly}
                </span>
              </div>
              {loadingSummary && useGamificationApi ? (
                <div className="flex h-[280px] items-center justify-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  {a.loadingChart}
                </div>
              ) : filteredCategories.length ? (
                <>
                  <div className="space-y-2.5">
                    {filteredCategories.map((row) => (
                      <div key={row.key} className="grid grid-cols-[minmax(7rem,1fr)_4rem] items-center gap-3">
                        <div className="min-w-0">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-semibold text-neutral-700">{row.name}</p>
                            <span className="text-[11px] font-medium text-neutral-500">{row.pct}%</span>
                          </div>
                          <div className="h-3 w-full overflow-hidden rounded-full bg-neutral-100">
                            <div
                              className={`h-full rounded-full ${heatCellClass(row.pct)}`}
                              style={{ width: `${row.pct}%` }}
                              title={`${row.name}: ${row.pct}%`}
                            />
                          </div>
                        </div>
                        <div className="text-right text-xs font-medium text-neutral-500">{row.learners}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-neutral-600">
                    <span className="font-semibold uppercase tracking-wide">{a.heatmapLegendTitle}</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-emerald-100" /> {a.heatmapLegend404}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-emerald-300" /> {a.heatmapLegend4060}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-emerald-500" /> {a.heatmapLegend6080}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-3 w-3 rounded bg-emerald-800" /> {a.heatmapLegend80100}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-neutral-400">{a.heatmapAggregateFootnote}</p>
                </>
              ) : (
                <p className="py-16 text-center text-sm text-neutral-500">
                  {useGamificationApi ? a.noCategory : a.gamificationOffCategory}
                </p>
              )}
            </section>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-3 shadow-sm sm:p-5 lg:col-span-5">
              <h2 className="mb-3 truncate text-sm font-bold text-neutral-900 sm:mb-4 sm:text-base lg:text-lg">
                {a.questionLevelAnalysisTitle}
              </h2>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex h-10 w-full min-w-0 overflow-hidden rounded-xl shadow-inner ring-1 ring-neutral-100 sm:h-14 sm:rounded-2xl">
                  <div
                    className="min-h-0 min-w-0 bg-gradient-to-br from-blue-500 to-blue-700"
                    style={{ flex: `0 0 ${questionMix.easyShare}%` }}
                  />
                  <div
                    className="min-h-0 min-w-0 bg-gradient-to-br from-amber-300 to-amber-500"
                    style={{ flex: `0 0 ${questionMix.midShare}%` }}
                  />
                  <div
                    className="min-h-0 min-w-0 bg-gradient-to-br from-rose-400 to-rose-600"
                    style={{ flex: `0 0 ${questionMix.hardShare}%` }}
                  />
                </div>
                <div className="grid min-w-0 grid-cols-3 gap-1 sm:gap-2">
                  <div className="flex min-w-0 flex-col items-center gap-0.5 rounded-md bg-neutral-50/90 px-1 py-1.5 ring-1 ring-neutral-100 sm:flex-row sm:items-center sm:gap-2 sm:rounded-lg sm:px-2 sm:py-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gradient-to-br from-blue-500 to-blue-700 sm:mt-0 sm:h-3 sm:w-3"
                      aria-hidden
                    />
                    <div className="min-w-0 text-center sm:text-left">
                      <p className="text-[11px] font-semibold tabular-nums text-neutral-900 sm:text-xs">
                        {questionMix.easyShare}%
                      </p>
                      <p className="line-clamp-2 text-[9px] leading-tight text-neutral-600 sm:text-[11px]">
                        {a.easyToAnswerLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col items-center gap-0.5 rounded-md bg-neutral-50/90 px-1 py-1.5 ring-1 ring-neutral-100 sm:flex-row sm:items-center sm:gap-2 sm:rounded-lg sm:px-2 sm:py-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gradient-to-br from-amber-300 to-amber-500 sm:mt-0 sm:h-3 sm:w-3"
                      aria-hidden
                    />
                    <div className="min-w-0 text-center sm:text-left">
                      <p className="text-[11px] font-semibold tabular-nums text-neutral-900 sm:text-xs">
                        {questionMix.midShare}%
                      </p>
                      <p className="line-clamp-2 text-[9px] leading-tight text-neutral-600 sm:text-[11px]">
                        {a.difficultToAnswerLabel}
                      </p>
                    </div>
                  </div>
                  <div className="flex min-w-0 flex-col items-center gap-0.5 rounded-md bg-neutral-50/90 px-1 py-1.5 ring-1 ring-neutral-100 sm:flex-row sm:items-center sm:gap-2 sm:rounded-lg sm:px-2 sm:py-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-sm bg-gradient-to-br from-rose-400 to-rose-600 sm:mt-0 sm:h-3 sm:w-3"
                      aria-hidden
                    />
                    <div className="min-w-0 text-center sm:text-left">
                      <p className="text-[11px] font-semibold tabular-nums text-neutral-900 sm:text-xs">
                        {questionMix.hardShare}%
                      </p>
                      <p className="line-clamp-2 text-[9px] leading-tight text-neutral-600 sm:text-[11px]">
                        {a.hardToAnswerLabel}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid min-w-0 grid-cols-3 gap-1 text-center sm:gap-2">
                  <div className="min-w-0 rounded-lg border border-blue-100 bg-blue-50/80 px-1 py-1.5 sm:rounded-xl sm:px-2 sm:py-2">
                    <p className="text-sm font-bold tabular-nums text-blue-900 sm:text-base">{questionMix.easyCorrect}%</p>
                    <p className="mt-0.5 text-[9px] font-medium leading-tight text-blue-800/90 sm:text-[10px]">
                      {a.segmentAnsweredCorrect}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-amber-100 bg-amber-50/80 px-1 py-1.5 sm:rounded-xl sm:px-2 sm:py-2">
                    <p className="text-sm font-bold tabular-nums text-amber-950 sm:text-base">{questionMix.midCorrect}%</p>
                    <p className="mt-0.5 text-[9px] font-medium leading-tight text-amber-900/90 sm:text-[10px]">
                      {a.segmentAnsweredCorrect}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-lg border border-rose-100 bg-rose-50/80 px-1 py-1.5 sm:rounded-xl sm:px-2 sm:py-2">
                    <p className="text-sm font-bold tabular-nums text-rose-900 sm:text-base">{questionMix.hardCorrect}%</p>
                    <p className="mt-0.5 text-[9px] font-medium leading-tight text-rose-900/90 sm:text-[10px]">
                      {a.segmentAnsweredCorrect}
                    </p>
                  </div>
                </div>
                {!hasPeople && (
                  <p className="text-center text-[10px] text-neutral-500 sm:text-xs">{a.noStatusSplit}</p>
                )}
              </div>
            </section>
          </div>

          {/* Bottom: acceleration + engagement + growth + side cards */}
          <div className="grid gap-4 lg:grid-cols-12">
            <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm sm:p-5 lg:col-span-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-bold text-neutral-900">{a.accelerationTitle}</h2>
                <div className="relative">
                  <select
                    value={accelerationPeriod}
                    onChange={(e) => setAccelerationPeriod(e.target.value as 'week' | 'month')}
                    className="appearance-none rounded-xl border border-neutral-200 bg-neutral-50 py-1.5 pl-2.5 pr-8 text-xs font-medium text-neutral-800"
                  >
                    <option value="week">{a.accelerationThisWeek}</option>
                    <option value="month">{a.accelerationThisMonth}</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[440px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-neutral-200 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
                      <th className="py-2 pr-2">{a.thPriority}</th>
                      <th className="py-2 pr-2">{a.thFocus}</th>
                      <th className="py-2 pr-2">{a.thStatus}</th>
                      <th className="py-2 pr-2">{a.thAction}</th>
                      <th className="py-2 text-right">{a.thImpact}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {filteredAccelerationRows.map((r) => (
                      <tr key={r.focus}>
                        <td className="py-2.5 pr-2 align-top">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              r.priority === 'urgent'
                                ? 'bg-red-100 text-red-800'
                                : r.priority === 'high'
                                  ? 'bg-orange-100 text-orange-900'
                                  : r.priority === 'medium'
                                    ? 'bg-sky-100 text-sky-900'
                                    : 'bg-emerald-100 text-emerald-900'
                            }`}
                          >
                            {r.priority === 'urgent'
                              ? a.priorityUrgent
                              : r.priority === 'high'
                                ? a.priorityHigh
                                : r.priority === 'medium'
                                  ? a.priorityMedium
                                  : a.priorityLow}
                          </span>
                        </td>
                        <td className="py-2.5 pr-2 align-top font-semibold text-neutral-800">{r.focus}</td>
                        <td className="py-2.5 pr-2 align-top text-neutral-600">{r.status}</td>
                        <td className="py-2.5 pr-2 align-top text-neutral-700">{r.action}</td>
                        <td className="py-2.5 text-right align-top font-semibold text-emerald-800">{r.impact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredAccelerationRows.length === 0 && (
                <p className="py-8 text-center text-sm text-neutral-500">{a.noCategory}</p>
              )}
            </section>

            <div className="flex flex-col gap-4 lg:col-span-4">
              <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-neutral-900">{a.conversionTitle}</h2>
                <p className="mt-1 text-2xl font-bold text-neutral-900">{totalUsersScope}</p>
                <p className="text-xs text-neutral-500">{a.conversionTotal}</p>
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-neutral-600">
                      <span>{a.conversionActive}</span>
                      <span className="font-semibold tabular-nums">
                        {useGamificationApi && summary != null ? summary.activeUserCount ?? rosterStats.active : rosterStats.active}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{
                          width: `${
                            totalUsersScope > 0
                              ? Math.round(
                                  ((useGamificationApi && summary != null
                                    ? summary.activeUserCount ?? rosterStats.active
                                    : rosterStats.active) /
                                    totalUsersScope) *
                                    100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-xs text-neutral-600">
                      <span>{a.conversionInactive}</span>
                      <span className="font-semibold tabular-nums">
                        {Math.max(
                          0,
                          totalUsersScope -
                            (useGamificationApi && summary != null
                              ? summary.activeUserCount ?? rosterStats.active
                              : rosterStats.active),
                        )}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className="h-full rounded-full bg-neutral-300"
                        style={{
                          width: `${
                            totalUsersScope > 0
                              ? Math.round(
                                  (Math.max(
                                    0,
                                    totalUsersScope -
                                      (useGamificationApi && summary != null
                                        ? summary.activeUserCount ?? rosterStats.active
                                        : rosterStats.active),
                                  ) /
                                    totalUsersScope) *
                                    100,
                                )
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-neutral-900">{a.growthTitle}</h2>
                <div className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                  {interpolate(a.growthDeltaLabel, { delta: growthDelta >= 0 ? `+${growthDelta}` : `${growthDelta}` })}
                </div>
                <div className="mt-2 h-[200px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineGrowthData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-neutral-100" />
                      <XAxis dataKey="attempt" tick={{ fontSize: 10 }} tickFormatter={(v) => truncateLabel(String(v), 10)} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={32} />
                      <Tooltip formatter={(v: number) => [`${v}%`, a.avgCompletion]} />
                      <Line type="monotone" dataKey="score" stroke={CHART_EMERALD} strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-3">
              <section className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-bold text-neutral-900">
                  {weakestCategory ? interpolate(a.weakTopicTitle, { topic: formatCategoryLabel(weakestCategory.category) }) : a.recommendationTitle}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {weakestCategory && (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-800">
                      {interpolate(a.crisisPill, { pct: weakTopicPassPct })}
                    </span>
                  )}
                  <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-900">
                    {a.actionPill}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-neutral-600">
                  {weakestCategory
                    ? interpolate(a.recommendationBody, { category: formatCategoryLabel(weakestCategory.category) })
                    : a.recommendationFallback}
                </p>
              </section>

              <section
                className="flex flex-1 flex-col justify-between rounded-2xl p-5 text-white shadow-lg"
                style={{ backgroundColor: TEAL_PRIMARY }}
              >
                <div>
                  <Trophy className="mb-2 h-8 w-8 text-amber-200" />
                  <h2 className="text-lg font-bold leading-snug">{a.upgradeCardTitle}</h2>
                  <p className="mt-2 text-sm text-emerald-100/95">{a.upgradeCardBody}</p>
                </div>
                <Link
                  to="/admin/reports"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-white py-2.5 text-sm font-bold text-emerald-950 shadow hover:bg-emerald-50"
                >
                  {a.upgradeCardCta}
                </Link>
              </section>
            </div>
          </div>

          {/* Secondary charts row */}
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm lg:col-span-6">
              <h2 className="mb-3 text-base font-bold text-neutral-900">{a.peopleByDept}</h2>
              {filteredDeptChartData.length ? (
                <div className="h-[240px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={filteredDeptChartData} margin={{ left: 4, right: 10, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal className="stroke-neutral-100" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => truncateLabel(String(v), 16)}
                      />
                      <Tooltip />
                      <Bar dataKey="count" name={a.peopleSeries} fill={CHART_EMERALD_LIGHT} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-neutral-500">{a.noDeptData}</p>
              )}
            </div>
            <div className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-sm lg:col-span-6">
              <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-neutral-900">
                <Trophy className="h-5 w-5 text-amber-500" />
                {a.topChallengers}
              </h2>
              {loadingSummary && useGamificationApi ? (
                <div className="flex h-[240px] items-center justify-center gap-2 text-sm text-neutral-500">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  {a.loadingChart}
                </div>
              ) : filteredChallengerBarData.length ? (
                <div className="h-[240px] w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={filteredChallengerBarData} margin={{ left: 4, right: 10, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal className="stroke-neutral-100" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v: string) => truncateLabel(String(v), 12)}
                      />
                      <Tooltip
                        formatter={(value: number, _name: string, item: { payload?: { completed?: number } }) => [
                          interpolate(a.challengerTooltip, {
                            xp: value,
                            passed: item?.payload?.completed ?? 0,
                          }),
                          a.challengerSeries,
                        ]}
                      />
                      <Bar dataKey="xp" fill={CHART_AMBER} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-12 text-center text-sm text-neutral-500">{a.noLeaderboard}</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
