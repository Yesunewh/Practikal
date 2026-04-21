import { Link } from 'react-router-dom';
import { User, Rank } from '../types';
import { Check, Info, Lock, TrendingUp } from 'lucide-react';
import { xpProgressInCurrentTier } from '../utils/gamificationMetrics';

interface LeaderboardHeaderProps {
  user: User;
  /** Organization name from profile / API (shown in standings context). */
  organizationLabel?: string;
  /** Current leaderboard scope, e.g. "Your organization". */
  scopeLabel?: string;
}

export default function LeaderboardHeader({ user, organizationLabel, scopeLabel }: LeaderboardHeaderProps) {
  const ranks: Rank[] = ['beginner', 'medior', 'senior', 'professional', 'specialist', 'master', 'legend'];

  const formatDate = () => {
    const date = new Date();
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Leaderboard</h1>
      <p className="text-gray-600 mb-3">
        Standings compare learners by <strong>total XP</strong> (primary order), plus reputation, count of challenges
        mastered (70%+ or pass), and activity streaks. This page does <strong>not</strong> control who appears on the
        board — challenge locks only affect which training you can open on the <strong>Challenges</strong> page.
      </p>
      {(organizationLabel || scopeLabel) && (
        <p className="text-sm text-emerald-800 font-medium mb-4">
          {scopeLabel && <span>{scopeLabel}</span>}
          {organizationLabel && scopeLabel && ' · '}
          {organizationLabel && <span>{organizationLabel}</span>}
        </p>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50/90 px-4 py-3 mb-6 flex gap-3 text-sm text-slate-700">
        <Info className="shrink-0 w-5 h-5 text-slate-500 mt-0.5" aria-hidden />
        <div>
          <p className="font-medium text-slate-800 mb-1">Challenge difficulty locks (by category)</p>
          <p className="text-slate-600">
            On <strong>Challenges</strong>, each <strong>topic</strong> (e.g. Phishing, Password) unlocks{' '}
            <strong>intermediate</strong> only after every <strong>visible beginner</strong> in that topic is mastered,
            and <strong>advanced</strong> after every <strong>visible intermediate</strong>. That is separate from the{' '}
            <strong>XP rank</strong> ladder below (Beginner → Legend), which is based only on how much XP you have
            earned.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link to="/challenges" className="text-emerald-700 hover:text-emerald-800 font-medium">
              Open Challenges — locks show on each card
            </Link>
            <span className="text-slate-500 text-xs">Full write-up: repo file docs/UI_USER_GUIDE.md §4.2</span>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Your XP rank ladder</h2>
        <p className="text-xs text-gray-500 mb-3">
          These steps are <strong>XP levels only</strong> (not challenge topics). Earn XP from passed challenges to move
          right along the ladder.
        </p>
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-4" role="list" aria-label="Rank state legend">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden />
            <span>Unlocked</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white border-2 border-emerald-600 px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden />
            <span>Current</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-dashed border-gray-300 px-2.5 py-1">
            <Lock className="w-3.5 h-3.5 text-gray-400" aria-hidden />
            <span>Locked — need more XP</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-8">
        <div
          className="flex flex-nowrap gap-3 sm:gap-4 overflow-x-auto pb-2 w-full max-w-full [scrollbar-width:thin]"
          role="list"
          aria-label="XP rank steps"
        >
          {ranks.map((rank, index) => {
            const currentIdxRaw = ranks.indexOf(user.rank.current);
            const currentIdx = currentIdxRaw >= 0 ? currentIdxRaw : 0;
            const isCurrentRank = index === currentIdx;
            const isPastRank = index < currentIdx;
            const isFutureRank = index > currentIdx;

            return (
              <div key={rank} className="flex flex-col items-center min-w-[4.5rem] shrink-0" role="listitem">
                <div
                  className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors
                  ${
                    isFutureRank
                      ? 'border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400'
                      : isCurrentRank
                        ? 'border-[3px] border-emerald-600 bg-white text-emerald-800 shadow-sm ring-2 ring-emerald-100'
                        : 'bg-emerald-100 text-emerald-800 border-2 border-emerald-200'
                  }`}
                >
                  {isFutureRank ? (
                    <Lock className="w-6 h-6" aria-hidden />
                  ) : isPastRank ? (
                    <Check className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.5} aria-hidden />
                  ) : (
                    <span className="text-lg font-bold">{rank.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <span
                  className={`text-xs sm:text-sm mt-2 font-medium text-center leading-tight max-w-[5.5rem] ${
                    isCurrentRank ? 'text-emerald-800' : isFutureRank ? 'text-gray-400' : 'text-emerald-700'
                  }`}
                >
                  {rank.charAt(0).toUpperCase() + rank.slice(1)}
                </span>
                <span
                  className={`text-[10px] sm:text-xs mt-0.5 font-medium uppercase tracking-wide ${
                    isPastRank ? 'text-emerald-600' : isCurrentRank ? 'text-emerald-700' : 'text-gray-400'
                  }`}
                >
                  {isPastRank ? 'Unlocked' : isCurrentRank ? 'Current' : 'Locked'}
                </span>
                {isCurrentRank && <span className="text-[10px] text-gray-500 mt-1">{formatDate()}</span>}
              </div>
            );
          })}
        </div>

        <div className="shrink-0 w-full lg:w-72 bg-emerald-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-3 h-3" aria-hidden />
            </span>
            <h3 className="font-medium">Next XP rank</h3>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Next tier: <strong>{user.rank.next.charAt(0).toUpperCase() + user.rank.next.slice(1)}</strong>
            {user.xpToNextLevel > 0 ? (
              <>
                {' '}
                — <strong>{user.xpToNextLevel.toLocaleString()}</strong> XP remaining in this tier.
              </>
            ) : null}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-emerald-400 h-2 rounded-full transition-all"
              style={{ width: `${xpProgressInCurrentTier(user.xp)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mb-2">
        <h2 className="text-2xl font-bold text-gray-800">Standings</h2>
      </div>
    </div>
  );
}
