import type { Challenge, ChallengeAttempt } from '../types';

/** Minimum score (percent) to count a challenge as passed / mastered in UI and progress totals. */
export const CHALLENGE_PASS_SCORE_PERCENT = 70;

const CATEGORY_LABELS: Record<string, string> = {
  phishing: 'Phishing',
  malware: 'Malware',
  password: 'Password',
  general: 'General',
  'social-engineering': 'Social engineering',
  'incident-response': 'Incident response',
};

/** Human-readable category name for UI (unlock messages, etc.). */
export function categoryDisplayLabel(slug: Challenge['category'] | string): string {
  const key = String(slug || '').toLowerCase();
  if (CATEGORY_LABELS[key]) return CATEGORY_LABELS[key];
  return String(slug)
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Completed attempts that count as mastered: API `passed` flag or score at/above threshold. */
export function challengeAttemptCountsAsPassed(
  a: Pick<ChallengeAttempt, 'passed' | 'score' | 'completedAt'>,
): boolean {
  if (!a.completedAt) return false;
  if (a.passed) return true;
  const n = Number(a.score);
  return !Number.isNaN(n) && n >= CHALLENGE_PASS_SCORE_PERCENT;
}
