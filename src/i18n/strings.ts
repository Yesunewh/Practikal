/** Minimal strings table — extend with locales or wire to react-i18next later. */
const en = {
  dashboard: {
    reputation: 'Your reputation',
    streakTitle: 'Activity streak',
    streakHelp: 'Consecutive days with at least one passed challenge:',
    best: 'best:',
    recommended: 'Recommended for you',
    browseChallenges: 'Browse challenges',
    assignedTitle: 'Assigned training',
    noAssignments: 'No assignments right now.',
    daysLeft: 'days left',
    overdue: 'Overdue',
    due: 'Due',
    start: 'Start',
    pathsTitle: 'Learning paths',
    challengesTitle: 'Available challenges',
    completedLabel: 'Complete',
    progressLabel: 'Progress',
    weeklyPick: 'This week’s micro-challenge',
    weeklyPickHelp: 'Short focus rotation — complete for extra consistency.',
  },
} as const;

export type Locale = 'en';

const tables: Record<Locale, typeof en> = { en };

export function getStrings(locale: Locale = 'en') {
  return tables[locale] ?? en;
}
