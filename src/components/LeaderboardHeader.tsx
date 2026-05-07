import { User, Rank } from '../types';
import { Check, Lock, TrendingUp } from 'lucide-react';
import { xpProgressInCurrentTier } from '../utils/gamificationMetrics';
import { useI18n } from '../i18n/I18nContext';
import { interpolate } from '../i18n/messages';

interface LeaderboardHeaderProps {
  user: User;
}

export default function LeaderboardHeader({ user }: LeaderboardHeaderProps) {
  const { messages } = useI18n();
  const lb = messages.leaderboard;
  const ranks: Rank[] = ['beginner', 'medior', 'senior', 'professional', 'specialist', 'master', 'legend'];

  const formatDate = () => {
    const date = new Date();
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">{lb.headerTitle}</h1>
      {lb.headerIntro?.trim() ? <p className="text-gray-600 mb-3">{lb.headerIntro}</p> : null}

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">{lb.rankLadderTitle}</h2>
        {lb.rankLadderHelp?.trim() ? <p className="text-xs text-gray-500 mb-3">{lb.rankLadderHelp}</p> : null}
        <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-4" role="list" aria-label={lb.rankLegendAria}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-100 px-2.5 py-1">
            <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden />
            <span>{lb.legendUnlocked}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white border-2 border-emerald-600 px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-emerald-600" aria-hidden />
            <span>{lb.legendCurrent}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 border border-dashed border-gray-300 px-2.5 py-1">
            <Lock className="w-3.5 h-3.5 text-gray-400" aria-hidden />
            <span>{lb.legendLocked}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-8">
        <div
          className="flex flex-nowrap gap-3 sm:gap-4 overflow-x-auto pb-2 w-full max-w-full [scrollbar-width:thin]"
          role="list"
          aria-label={lb.rankListAria}
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
                  {isPastRank ? lb.legendUnlocked : isCurrentRank ? lb.legendCurrent : lb.rankLadderLockedShort}
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
            <h3 className="font-medium">{lb.nextXpCardTitle}</h3>
          </div>
          <div className="text-sm text-gray-600 mb-2">
            {user.xpToNextLevel > 0
              ? interpolate(lb.nextTierWithXp, {
                  rank: user.rank.next.charAt(0).toUpperCase() + user.rank.next.slice(1),
                  xp: user.xpToNextLevel.toLocaleString(),
                })
              : interpolate(lb.nextTierOnly, {
                  rank: user.rank.next.charAt(0).toUpperCase() + user.rank.next.slice(1),
                })}
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
        <h2 className="text-2xl font-bold text-gray-800">{lb.standingsHeading}</h2>
      </div>
    </div>
  );
}
