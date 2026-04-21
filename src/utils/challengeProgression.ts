import type { Challenge } from '../types';
import { categoryDisplayLabel } from '../constants/challenges';

export type ProgressionLock = {
  progressionLocked: boolean;
  progressionLockReason: string | null;
};

/** Match backend `difficultyTier`: 0 beginner, 1 intermediate, 2 advanced. */
export function difficultyTier(d: string | undefined): number {
  const key = String(d || '').toLowerCase();
  if (key === 'intermediate') return 1;
  if (key === 'advanced') return 2;
  return 0;
}

/**
 * Per-category tier gating (among visible challenges only):
 * - Beginner: available.
 * - Intermediate: locked until every visible beginner in that category is mastered.
 * - Advanced: locked until every visible intermediate in that category is mastered.
 * - No lower-tier challenges in that category → next tier is not blocked by that tier.
 * - Already-mastered challenge → stays unlocked for replay.
 */
export function evaluateChallengeProgressionLock(
  challenge: Pick<Challenge, 'id' | 'category' | 'difficulty'>,
  allVisible: Pick<Challenge, 'id' | 'category' | 'difficulty'>[],
  passedIds: Set<string>,
): ProgressionLock {
  if (passedIds.has(challenge.id)) {
    return { progressionLocked: false, progressionLockReason: null };
  }
  const tier = difficultyTier(challenge.difficulty);
  if (tier <= 0) {
    return { progressionLocked: false, progressionLockReason: null };
  }
  const requiredTier = tier - 1;
  const requiredLabel = requiredTier === 0 ? 'beginner' : 'intermediate';
  const cat = challenge.category;
  const prerequisites = allVisible.filter(
    (c) => c.category === cat && difficultyTier(c.difficulty) === requiredTier,
  );
  if (prerequisites.length === 0) {
    return { progressionLocked: false, progressionLockReason: null };
  }
  const done = prerequisites.filter((c) => passedIds.has(c.id)).length;
  const total = prerequisites.length;
  if (done >= total) {
    return { progressionLocked: false, progressionLockReason: null };
  }
  const catLabel = categoryDisplayLabel(cat);
  const reason = `Complete all ${requiredLabel} challenges in the ${catLabel} category first (${done}/${total} done).`;
  return { progressionLocked: true, progressionLockReason: reason };
}

/** Prefer API `progressionLocked` when present; otherwise compute locally (mock / offline). */
export function mergeApiOrLocalProgression(
  challenge: Challenge,
  allVisible: Challenge[],
  passedIds: Set<string>,
): ProgressionLock {
  if (passedIds.has(challenge.id)) {
    return { progressionLocked: false, progressionLockReason: null };
  }
  if (challenge.progressionLocked === true || challenge.progressionLocked === false) {
    return {
      progressionLocked: challenge.progressionLocked,
      progressionLockReason: challenge.progressionLockReason ?? null,
    };
  }
  return evaluateChallengeProgressionLock(challenge, allVisible, passedIds);
}
