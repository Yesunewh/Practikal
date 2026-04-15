import type { Challenge, ChallengeAttempt, CategoryProgress, UserProgress, WeeklyActivity } from '../types';

const CATEGORIES: CategoryProgress['category'][] = [
  'phishing',
  'malware',
  'password',
  'general',
  'social-engineering',
  'incident-response',
];

function parseDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

export function reviveAttempts(raw: unknown[]): ChallengeAttempt[] {
  return raw.map((a) => {
    const x = a as ChallengeAttempt;
    return {
      ...x,
      startedAt: parseDate(x.startedAt),
      completedAt: x.completedAt ? parseDate(x.completedAt) : undefined,
    };
  });
}

function dayKey(t: Date): string {
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

/** Consecutive calendar days (local) ending at most recent activity with at least one passed challenge per day */
export function computeDailyStreak(passedAttempts: ChallengeAttempt[]): {
  current: number;
  longest: number;
  lastActive: Date;
} {
  const daysWithPass = new Set<string>();
  let lastActive = new Date(0);

  for (const a of passedAttempts) {
    if (!a.passed || !a.completedAt) continue;
    const t = parseDate(a.completedAt);
    if (t > lastActive) lastActive = t;
    daysWithPass.add(dayKey(t));
  }

  if (daysWithPass.size === 0) {
    return { current: 0, longest: 0, lastActive: new Date() };
  }

  const sortedDays = [...daysWithPass].sort();

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(sortedDays[i - 1] + 'T12:00:00');
    const curr = new Date(sortedDays[i] + 'T12:00:00');
    const diff = (curr.getTime() - prev.getTime()) / (86400 * 1000);
    if (diff === 1) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 1;
    }
  }

  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86400000));

  let current = 0;
  if (daysWithPass.has(today)) {
    let d = new Date();
    while (daysWithPass.has(dayKey(d))) {
      current += 1;
      d = new Date(d.getTime() - 86400000);
    }
  } else if (daysWithPass.has(yesterday)) {
    let d = new Date(Date.now() - 86400000);
    while (daysWithPass.has(dayKey(d))) {
      current += 1;
      d = new Date(d.getTime() - 86400000);
    }
  }

  return { current, longest: Math.max(longest, current), lastActive };
}

function isoWeekKey(d: Date): string {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const start = new Date(Date.UTC(y, 0, 1));
  const week = Math.ceil(((t.getTime() - start.getTime()) / 86400000 + 1) / 7);
  return `${y}-W${String(week).padStart(2, '0')}`;
}

export function buildWeeklyActivity(attempts: ChallengeAttempt[], weeks = 8): WeeklyActivity[] {
  const now = new Date();
  const result: WeeklyActivity[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const w = new Date(now);
    w.setDate(w.getDate() - i * 7);
    const key = isoWeekKey(w);
    const inWeek = attempts.filter((a) => a.completedAt && isoWeekKey(parseDate(a.completedAt)) === key);
    const passed = inWeek.filter((a) => a.passed);
    const xp = passed.reduce((s, a) => s + Math.round(a.score * 10), 0);
    const time = Math.floor(inWeek.reduce((s, a) => s + a.timeSpent, 0) / 60);
    result.push({
      week: key,
      challengesCompleted: passed.length,
      xpEarned: xp,
      timeSpent: time,
    });
  }
  return result;
}

export function buildUserProgress(
  userId: string,
  challenges: Challenge[],
  rawAttempts: unknown[],
): UserProgress {
  const attempts = reviveAttempts(rawAttempts).filter((a) => a.userId === userId);
  const completed = attempts.filter((a) => a.completedAt);
  const passedAttempts = completed.filter((a) => a.passed);

  const challengeById = new Map(challenges.map((c) => [c.id, c]));
  const uniquePassedIds = new Set(passedAttempts.map((a) => a.challengeId));

  const totalAvailable = Math.max(challenges.length, 1);
  const totalChallengesCompleted = uniquePassedIds.size;
  const completionRate = (totalChallengesCompleted / totalAvailable) * 100;

  const averageScore =
    completed.length > 0 ? completed.reduce((s, a) => s + a.score, 0) / completed.length : 0;

  const totalTimeSpent = Math.floor(completed.reduce((s, a) => s + a.timeSpent, 0) / 60);

  const { current, longest, lastActive } = computeDailyStreak(passedAttempts);

  const categoryProgress: CategoryProgress[] = CATEGORIES.map((category) => {
    const inCat = challenges.filter((c) => c.category === category);
    const total = inCat.length;
    const completed = inCat.filter((c) => uniquePassedIds.has(c.id)).length;
    const catAttempts = passedAttempts.filter((a) => challengeById.get(a.challengeId)?.category === category);
    const avg =
      catAttempts.length > 0
        ? catAttempts.reduce((s, a) => s + a.score, 0) / catAttempts.length
        : 0;
    const timeSpent = Math.floor(
      catAttempts.reduce((s, a) => s + a.timeSpent, 0) / 60,
    );
    return {
      category,
      completed,
      total,
      averageScore: Math.round(avg),
      timeSpent,
    };
  });

  const weeklyActivity = buildWeeklyActivity(completed);

  return {
    totalChallengesCompleted,
    totalChallengesAvailable: totalAvailable,
    completionRate: Math.min(100, Math.round(completionRate)),
    averageScore: Math.round(averageScore),
    totalTimeSpent,
    currentStreak: current,
    longestStreak: longest,
    lastActive,
    categoryProgress,
    weeklyActivity,
    milestones: [],
    recentAchievements: [],
  };
}

export function getWeakestCategory(progress: UserProgress): CategoryProgress | null {
  const withData = progress.categoryProgress.filter((c) => c.total > 0);
  if (withData.length === 0) return null;
  return [...withData].sort((a, b) => a.averageScore - b.averageScore)[0];
}

export function getPassedChallengeIdsForUser(userId: string): Set<string> {
  const raw = JSON.parse(localStorage.getItem('challengeAttempts') || '[]');
  const attempts = reviveAttempts(raw).filter(
    (a) => a.userId === userId && a.passed && a.completedAt,
  );
  return new Set(attempts.map((a) => a.challengeId));
}
