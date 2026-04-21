import type { Challenge } from '../types';
import { reviveAttempts } from './progressCalculations';

export interface RemediationItem {
  attemptId: string;
  challengeId: string;
  challengeTitle: string;
  stepId: string;
  category: string;
  completedAt: Date;
}

export function getRemediationItems(
  userId: string,
  challenges: Challenge[],
  rawAttempts: unknown[],
): RemediationItem[] {
  const attempts = reviveAttempts(rawAttempts).filter((a) => a.userId === userId && a.completedAt);
  const byChallenge = new Map(challenges.map((c) => [c.id, c]));
  const items: RemediationItem[] = [];

  for (const att of attempts) {
    const ch = byChallenge.get(att.challengeId);
    if (!ch) continue;
    for (const ans of att.answers) {
      if (!ans.correct) {
        items.push({
          attemptId: att.id,
          challengeId: att.challengeId,
          challengeTitle: ch.title,
          stepId: ans.stepId,
          category: ch.category,
          completedAt: new Date(att.completedAt!),
        });
      }
    }
  }

  const sorted = items.sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  const seen = new Set<string>();
  const deduped: RemediationItem[] = [];
  for (const item of sorted) {
    const key = `${item.challengeId}:${item.stepId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}
