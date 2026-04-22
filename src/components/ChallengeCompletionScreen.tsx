import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, Sparkles, Trophy } from 'lucide-react';

export interface ChallengeCompletionScreenProps {
  passed: boolean;
  score: number;
  challengeTitle: string;
  passThreshold: number;
  onExit: () => void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function fireCelebrationConfetti() {
  const y = 0.58;
  confetti({
    particleCount: 110,
    spread: 76,
    startVelocity: 42,
    origin: { x: 0.5, y },
    ticks: 220,
    gravity: 1.05,
    scalar: 1,
  });
  window.setTimeout(() => {
    confetti({
      particleCount: 55,
      angle: 60,
      spread: 48,
      origin: { x: 0, y: y + 0.05 },
      ticks: 180,
    });
  }, 180);
  window.setTimeout(() => {
    confetti({
      particleCount: 55,
      angle: 120,
      spread: 48,
      origin: { x: 1, y: y + 0.05 },
      ticks: 180,
    });
  }, 320);
}

/**
 * Full-screen completion: winner treatment + confetti when passed; calmer layout when failed.
 */
export default function ChallengeCompletionScreen({
  passed,
  score,
  challengeTitle,
  passThreshold,
  onExit,
}: ChallengeCompletionScreenProps) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!passed || firedRef.current || prefersReducedMotion()) return;
    firedRef.current = true;
    fireCelebrationConfetti();
  }, [passed]);

  if (passed) {
    const perfect = score >= 100;

    return (
      <div
        className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-neutral-50 motion-safe:animate-fade-in"
        style={{
          paddingTop: 'max(0.25rem, env(safe-area-inset-top))',
          paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="mx-auto flex w-full min-h-0 max-w-lg flex-1 flex-col justify-center px-3 py-1 sm:px-4 sm:py-2">
          <div className="w-full rounded-2xl border border-neutral-200/90 bg-white px-3 py-3 text-center shadow-sm sm:px-5 sm:py-4 motion-safe:animate-celebration-card">
            <div className="mb-2 flex justify-center sm:mb-3">
              <div className="relative">
                <Trophy
                  className="h-14 w-14 text-amber-400 drop-shadow-sm motion-safe:animate-trophy-pop sm:h-[4.5rem] sm:w-[4.5rem]"
                  strokeWidth={1.25}
                  aria-hidden
                />
                <Sparkles
                  className="absolute -right-0.5 -top-0.5 h-5 w-5 text-emerald-500 motion-safe:animate-pulse sm:h-6 sm:w-6"
                  aria-hidden
                />
              </div>
            </div>

            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700 sm:text-xs sm:tracking-[0.2em]">
              Winner
            </p>
            <h2 className="font-serif text-2xl font-bold tracking-tight text-emerald-950 sm:text-3xl">You did it!</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-snug text-neutral-600 sm:mt-1.5 sm:text-sm">{challengeTitle}</p>

            <div className="my-3 flex flex-col items-center gap-0.5 sm:my-4 sm:gap-1">
              <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 sm:text-xs">Your score</span>
              <div
                className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-xl font-bold text-white shadow-md shadow-emerald-900/20 motion-safe:animate-score-pop sm:h-28 sm:w-28 sm:text-3xl"
                aria-live="polite"
              >
                {score}%
              </div>
              {perfect && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-900 sm:px-3 sm:py-1 sm:text-xs">
                  Perfect score
                </span>
              )}
            </div>

            <p className="mb-2 text-[11px] leading-snug text-neutral-600 sm:mb-3 sm:text-sm">
              Challenge completed — keep building your security skills.
            </p>

            <button
              type="button"
              onClick={onExit}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 sm:py-2.5"
            >
              Back to Challenges
            </button>
          </div>
        </div>
      </div>
    );
  }

  const title = challengeTitle.trim();

  return (
    <div
      className="flex h-dvh max-h-dvh min-h-0 flex-col overflow-hidden bg-neutral-50 motion-safe:animate-fade-in"
      style={{
        paddingTop: 'max(0.25rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mx-auto flex w-full min-h-0 max-w-lg flex-1 flex-col justify-center px-3 py-2 sm:max-w-xl sm:px-4 sm:py-3">
        <div className="w-full rounded-2xl border border-rose-200/90 bg-white px-4 py-5 text-center shadow-md shadow-rose-950/5 ring-1 ring-rose-900/[0.04] sm:px-6 sm:py-6 motion-safe:animate-fade-in-up">
          <div className="mb-3 flex justify-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 sm:h-16 sm:w-16"
              aria-hidden
            >
              <AlertCircle className="h-8 w-8 text-rose-600 sm:h-9 sm:w-9" strokeWidth={1.75} />
            </div>
          </div>

          <h2 className="mb-0.5 font-serif text-2xl font-bold tracking-tight text-rose-700 sm:mb-1 sm:text-3xl">
            Challenge incomplete
          </h2>

          <div className="my-4 flex flex-col items-center gap-0.5 sm:my-5 sm:gap-1">
            <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 sm:text-xs">Your score</span>
            <div
              className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-xl font-bold text-white shadow-md shadow-rose-900/25 motion-safe:animate-score-pop sm:h-24 sm:w-24 sm:text-3xl"
              aria-live="polite"
            >
              {score}%
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200/90 bg-neutral-50 px-3 py-3 text-left text-sm leading-relaxed text-neutral-700 sm:px-4 sm:text-[15px]">
            <p className="break-words">
              You scored <span className="font-semibold text-rose-700">{score}%</span>. You need{' '}
              <span className="font-semibold text-neutral-900">{passThreshold}%</span> to pass{' '}
              {title ? (
                <span className="font-medium text-neutral-800">{title}</span>
              ) : (
                <span className="font-medium text-neutral-800">this challenge</span>
              )}
              .
            </p>
          </div>

          <p className="mt-4 text-sm leading-snug text-neutral-600 sm:text-base">Try again when you&apos;re ready.</p>

          <button
            type="button"
            onClick={onExit}
            className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 sm:mt-6 sm:py-3"
          >
            Back to Challenges
          </button>
        </div>
      </div>
    </div>
  );
}
