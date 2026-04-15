import type { LearningPath } from '../types';

export const learningPaths: LearningPath[] = [
  {
    id: 'path-fundamentals',
    title: 'Security fundamentals',
    description: 'Password hygiene, phishing awareness, and malware basics—in order.',
    stepChallengeIds: ['1', '4', '3', '6'],
  },
  {
    id: 'path-ir',
    title: 'Incident readiness',
    description: 'Build toward confident incident response practice.',
    stepChallengeIds: ['3', '2'],
  },
];

export function pathCompletedCount(
  path: LearningPath,
  completedChallengeIds: Set<string>,
): number {
  return path.stepChallengeIds.filter((id) => completedChallengeIds.has(id)).length;
}
