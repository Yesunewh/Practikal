import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { AlertCircle, Sparkles, Trophy, Star, X } from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import { interpolate } from '../i18n/messages';
import { useRateChallengeMutation } from '../store/apiSlice/practikalApi';

export interface ChallengeCompletionScreenProps {
  passed: boolean;
  score: number;
  challengeId?: string;
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
    particleCount: 80,
    spread: 60,
    startVelocity: 35,
    origin: { x: 0.5, y },
    ticks: 200,
    gravity: 1,
    scalar: 0.9,
  });
  window.setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 40,
      origin: { x: 0, y: y + 0.1 },
      ticks: 150,
    });
  }, 150);
  window.setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 40,
      origin: { x: 1, y: y + 0.1 },
      ticks: 150,
    });
  }, 300);
}

export default function ChallengeCompletionScreen({
  passed,
  score,
  challengeId,
  challengeTitle,
  passThreshold,
  onExit,
}: ChallengeCompletionScreenProps) {
  const { messages } = useI18n();
  const c = messages.completion;
  const firedRef = useRef(false);
  const [rateChallenge] = useRateChallengeMutation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [hasRated, setHasRated] = useState(false);

  const handleRate = async (value: number) => {
    if (!challengeId || hasRated) return;
    setRating(value);
    try {
      await rateChallenge({ id: challengeId, rating: value }).unwrap();
      setHasRated(true);
    } catch (err) {
      console.error("Failed to rate challenge", err);
    }
  };

  useEffect(() => {
    if (!passed || firedRef.current || prefersReducedMotion()) return;
    firedRef.current = true;
    fireCelebrationConfetti();
  }, [passed]);

  const perfect = score >= 100;
  const title = challengeTitle.trim();

  return (
    <div
      className="flex min-h-screen flex-col bg-gray-50 motion-safe:animate-fade-in"
      style={{
        paddingTop: 'max(0.1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(0.1rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-start px-4 py-1 sm:py-1">
        <div className="w-full rounded-2xl border border-gray-200/90 bg-white px-6 py-4 text-center shadow-lg shadow-gray-200/50 motion-safe:animate-celebration-card sm:px-10 sm:py-6">
          {/* Header Section */}
          <h2 className="mb-2 text-center font-serif text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
            {title || c.thisChallenge}
          </h2>

          <div className="flex items-center justify-center gap-4 text-left">
            <div className="relative shrink-0">
              {passed ? (
                <>
                  <Trophy
                    className="h-12 w-12 text-amber-400 drop-shadow-sm motion-safe:animate-trophy-pop sm:h-16 sm:w-16"
                    strokeWidth={1.25}
                    aria-hidden
                  />
                  <Sparkles
                    className="absolute -right-1 -top-1 h-5 w-5 text-emerald-500 motion-safe:animate-pulse sm:h-7 sm:w-7"
                    aria-hidden
                  />
                </>
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 sm:h-16 sm:w-16">
                  <AlertCircle className="h-7 w-7 text-rose-500 sm:h-10 sm:w-10" strokeWidth={1.5} />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className={`text-lg font-bold sm:text-2xl ${passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                {passed ? c.youDidIt : c.failedTitle}
              </p>
            </div>
          </div>

          {/* Results Section */}
          <div className="my-4 space-y-4">
            <div className={`flex items-center justify-center gap-4 rounded-xl p-3 sm:p-4 ${passed ? 'bg-emerald-50/50' : 'bg-rose-50/50'}`}>
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400 sm:text-sm">
                {c.yourScore}
              </span>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold text-white shadow-lg motion-safe:animate-score-pop sm:h-20 sm:w-20 sm:text-2xl ${passed ? 'bg-emerald-500 shadow-emerald-200' : 'bg-rose-500 shadow-rose-200'
                    }`}
                  aria-live="polite"
                >
                  {score}%
                </div>
                {perfect && passed && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-900 sm:text-xs">
                    {c.perfectScore}
                  </span>
                )}
              </div>
            </div>

            <div className="text-center px-2">
              <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
                {passed
                  ? c.passedBlurb
                  : interpolate(c.needPass, {
                    score,
                    threshold: passThreshold,
                    title: title || c.thisChallenge,
                  })}
              </p>
            </div>
          </div>

          {/* Rating Section */}
          <div className="mb-4">
            {challengeId && !hasRated && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-400 text-center mb-1.5 mt-2">Rate this module</p>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => handleRate(star)}
                      className="transition-transform hover:scale-110 focus:outline-none"
                    >
                      <Star
                        size={24}
                        className={`transition-colors ${(hoverRating || rating) >= star
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-gray-100 text-gray-200'
                          }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
            {hasRated && (
              <div className="pt-2 border-t border-gray-100">
                <p className="mt-4 text-xs font-bold text-emerald-600 text-center uppercase tracking-wider">
                  Thanks for rating!
                </p>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="space-y-4">
            <button
              type="button"
              onClick={onExit}
              className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              {c.backToChallenges}
            </button>
            {!passed && (
              <p className="text-xs font-medium text-gray-400">
                {c.tryAgain}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}