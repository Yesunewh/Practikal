import { challengeAttemptCountsAsPassed } from '../constants/challenges';
import type { Challenge, ChallengeAnswer, ChallengeAttempt } from '../types';

export interface GamificationProgressAttemptDto {
  id: string;
  userId: string;
  challengeId: string;
  score: number;
  passed: boolean;
  timeSpent: number;
  startedAt: string;
  completedAt: string | null;
  stepAnswers?: unknown;
  challenge?: Challenge | null;
}

function normalizeStepAnswers(raw: unknown): ChallengeAnswer[] {
  if (!raw || !Array.isArray(raw)) return [];
  const out: ChallengeAnswer[] = [];
  for (const x of raw) {
    if (!x || typeof x !== 'object') continue;
    const o = x as Record<string, unknown>;
    const stepId = o.stepId ?? o.step_id;
    if (stepId == null || String(stepId) === '') continue;
    const ans = o.answer;
    const answer: string | string[] = Array.isArray(ans) ? (ans as string[]) : ans != null ? String(ans) : '';
    out.push({
      stepId: String(stepId),
      answer,
      correct: !!o.correct,
      timeSpent: typeof o.timeSpent === 'number' ? o.timeSpent : Number(o.time_spent) || 0,
    });
  }
  return out;
}

export function mapGamificationAttemptsToChallengeAttempts(
  rows: GamificationProgressAttemptDto[],
): ChallengeAttempt[] {
  return rows.map((a) => ({
    id: String(a.id),
    userId: a.userId,
    challengeId: a.challengeId,
    startedAt:
      typeof a.startedAt === 'string'
        ? a.startedAt
        : a.startedAt != null
          ? new Date(a.startedAt as string | number).toISOString()
          : new Date(0).toISOString(),
    completedAt:
      a.completedAt == null
        ? undefined
        : typeof a.completedAt === 'string'
          ? a.completedAt
          : new Date(a.completedAt as string | number).toISOString(),
    timeSpent: a.timeSpent ?? 0,
    score: a.score ?? 0,
    passed: !!a.passed,
    answers: normalizeStepAnswers(a.stepAnswers),
  }));
}

export function uniquePassedChallengeIds(attempts: ChallengeAttempt[]): string[] {
  const ids = new Set<string>();
  for (const a of attempts) {
    if (challengeAttemptCountsAsPassed(a)) ids.add(a.challengeId);
  }
  return [...ids];
}
