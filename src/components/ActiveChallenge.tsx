import { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { Messages } from '../i18n/messages';
import type {
  Challenge,
  ChallengeStep as ChallengeStepType,
} from '../types';
import { ArrowLeft } from 'lucide-react';
import ChallengeStep from './ChallengeStep';
import ChallengeCompletionScreen from './ChallengeCompletionScreen';
import { RootState, AppDispatch, store } from '../store';
import { startChallenge, completeChallenge, updateStepProgress } from '../store/slices/progressSlice';
import { mergeGamificationFromApi, recordChallengePassed } from '../store/slices/authSlice';
import { useCompleteGamificationChallengeMutation } from '../store/apiSlice/practikalApi';
import type { StepCompleteDetail } from '../types';
import { useGamificationApi } from '../config/gamification';
import { CHALLENGE_PASS_SCORE_PERCENT } from '../constants/challenges';
import { CHALLENGE_LAYOUT_EVENT } from '../constants/challengeLayoutEvents';
import { useI18n } from '../i18n/I18nContext';
import { interpolate } from '../i18n/messages';

interface ActiveChallengeProps {
  challenge: Challenge;
  onComplete: (success: boolean) => void;
  onExit: () => void;
}

function ChallengeStepProgress({
  steps,
  currentIndex,
  listAriaLabel,
  m,
}: {
  steps: ChallengeStepType[];
  currentIndex: number;
  listAriaLabel: string;
  m: Messages['challenges'];
}) {
  const total = steps.length;
  const currentDotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    currentDotRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    });
  }, [currentIndex, total]);

  if (total <= 0) return null;

  const stepAria = (n: number, kind: 'done' | 'current' | 'upcoming') => {
    if (kind === 'done') return interpolate(m.stepNavCompleted, { n, total });
    if (kind === 'current') return interpolate(m.stepNavCurrent, { n, total });
    return interpolate(m.stepNavUpcoming, { n, total });
  };

  return (
    <div className="w-full min-w-0">
      <nav className="min-w-0" aria-label={listAriaLabel}>
        <ol
          role="list"
          className="flex flex-nowrap items-center justify-start gap-0 overflow-x-auto overflow-y-visible py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {steps.map((step, index) => {
            const n = index + 1;
            const isDone = index < currentIndex;
            const isCurrent = index === currentIndex;
            const kind = isDone ? 'done' : isCurrent ? 'current' : 'upcoming';
            return (
              <li key={step.id ?? `step-${index}`} className="flex items-center shrink-0">
                {index > 0 && (
                  <span
                    className={`mx-0.5 h-0.5 w-2 shrink-0 rounded-full sm:mx-1 sm:w-4 ${
                      index <= currentIndex ? 'bg-emerald-500' : 'bg-emerald-300/80'
                    }`}
                    aria-hidden
                  />
                )}
                <span
                  ref={isCurrent ? currentDotRef : undefined}
                  className={`flex h-3.5 w-3.5 shrink-0 select-none items-center justify-center rounded-full border-2 text-[9px] font-bold tabular-nums shadow-sm transition-all sm:h-7 sm:w-7 sm:text-[11px] ${
                    isDone
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : isCurrent
                        ? 'border-emerald-600 bg-white text-emerald-900 ring-2 ring-emerald-500/45'
                        : 'border-emerald-400/90 bg-emerald-50/90 text-emerald-800/90'
                  }`}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={stepAria(n, kind)}
                >
                  <span aria-hidden>{n}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}

export default function ActiveChallenge({ challenge, onComplete, onExit }: ActiveChallengeProps) {
  const { messages } = useI18n();
  const ch = messages.challenges;
  const completion = messages.completion;
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const challengeStartMs = useSelector((state: RootState) => state.progress.startTime);
  const [completeGamificationChallenge] = useCompleteGamificationChallengeMutation();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const startedRef = useRef(false);
  /** Last finished run (avoids stale `correctAnswers` on the completion screen). */
  const outcomeRef = useRef<{ score: number; passed: boolean }>({ score: 0, passed: false });

  useEffect(() => {
    startedRef.current = false;
    outcomeRef.current = { score: 0, passed: false };
  }, [challenge.id]);

  useEffect(() => {
    if (!user || startedRef.current) return;
    startedRef.current = true;
    dispatch(startChallenge({ challengeId: challenge.id, userId: user.id }));
  }, [challenge.id, user?.id, dispatch]);

  const handleStepComplete = (detail: StepCompleteDetail) => {
    dispatch(updateStepProgress({ stepId: detail.stepId, answer: detail.answer, correct: detail.correct, timeSpent: 0 }));

    const nextCorrect = correctAnswers + (detail.correct ? 1 : 0);
    const isLast = currentStepIndex === challenge.steps.length - 1;

    if (isLast) {
      const score = Math.round((nextCorrect / challenge.steps.length) * 100);
      const passed = score >= CHALLENGE_PASS_SCORE_PERCENT;
      outcomeRef.current = { score, passed };
      const timeSpentSec = challengeStartMs
        ? Math.floor((Date.now() - challengeStartMs) / 1000)
        : 0;
      const stepAnswers = store.getState().progress.currentAttempt?.answers ?? [];

      const finishLocal = () => {
        dispatch(completeChallenge({ score, passed }));
        if (passed) {
          dispatch(recordChallengePassed(challenge.id));
        }
        setCorrectAnswers(nextCorrect);
        setIsComplete(true);
        onComplete(passed);
      };

      setSubmitError(null);
      if (useGamificationApi) {
        completeGamificationChallenge({
          challengeId: challenge.id,
          score,
          passed,
          timeSpentSec,
          stepAnswers,
        })
          .unwrap()
          .then((res) => {
            if (res?.user) dispatch(mergeGamificationFromApi(res.user));
            finishLocal();
          })
          .catch((err: unknown) => {
            const e = err as { data?: { message?: string } };
            const msg = e?.data?.message;
            setSubmitError(typeof msg === 'string' ? msg : completion.submitErrorDefault);
          });
        return;
      }

      finishLocal();
      return;
    }

    setCorrectAnswers(nextCorrect);
    setTimeout(() => {
      setCurrentStepIndex(prev => prev + 1);
    }, 1500);
  };

  const totalSteps = challenge.steps.length;
  const stepCurrent = Math.min(currentStepIndex + 1, Math.max(totalSteps, 1));
  const questionsRemaining = totalSteps > 0 ? totalSteps - currentStepIndex : 0;

  /** Steps with only `information` are treated as intro: no title/progress header until the first other step. */
  const firstNonIntroStepIndex = useMemo(
    () => challenge.steps.findIndex((s) => s.type !== 'information'),
    [challenge.steps],
  );
  const inQuestionPhase =
    firstNonIntroStepIndex === -1 ? true : currentStepIndex >= firstNonIntroStepIndex;

  useEffect(() => {
    if (!inQuestionPhase) return;
    window.dispatchEvent(
      new CustomEvent(CHALLENGE_LAYOUT_EVENT, { detail: { phase: 'challenge-questions' } }),
    );
  }, [inQuestionPhase]);

  useEffect(() => {
    if (!isComplete) return;
    window.dispatchEvent(new CustomEvent(CHALLENGE_LAYOUT_EVENT, { detail: { phase: 'challenge-end' } }));
  }, [isComplete]);

  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent(CHALLENGE_LAYOUT_EVENT, { detail: { phase: 'challenge-end' } }));
    };
  }, []);

  if (isComplete) {
    const { score, passed } = outcomeRef.current;

    return (
      <ChallengeCompletionScreen
        passed={passed}
        score={score}
        challengeId={challenge.id}
        challengeTitle={challenge.title}
        passThreshold={CHALLENGE_PASS_SCORE_PERCENT}
        onExit={onExit}
      />
    );
  }

  const progressAria = interpolate(ch.activeProgressAria, {
    current: stepCurrent,
    total: totalSteps,
    remaining: questionsRemaining,
  });

  return (
    <div className="min-h-[calc(100dvh-1px)] min-w-0 bg-[#e8f5ec] text-emerald-950">
      <header className="bg-[#e8f5ec]/95 px-4 py-1 sm:py-1.5">
        <div className="max-w-3xl mx-auto">
          {!inQuestionPhase ? (
            <button
              type="button"
              onClick={onExit}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-full text-emerald-950 ring-1 ring-emerald-300/50 hover:bg-white/60"
              aria-label={ch.leaveChallenge}
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
              {ch.leaveChallenge}
            </button>
          ) : (
            <>
              <div className="mb-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:mb-2.5 sm:gap-3">
                <button
                  type="button"
                  onClick={onExit}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-emerald-950 ring-1 ring-emerald-300/50 hover:bg-white/60 sm:h-9 sm:w-9"
                  aria-label={ch.leaveChallenge}
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
                </button>
                <h1 className="min-w-0 text-center text-lg font-semibold tracking-tight text-emerald-950 sm:text-xl md:text-2xl">
                  {totalSteps > 0 ? `${challenge.title} (${stepCurrent}/${totalSteps})` : challenge.title}
                </h1>
                <span className="h-8 w-8 sm:h-9 sm:w-9" aria-hidden />
              </div>
              <div className="items-start">
                <div className="max-w-full min-w-0 px-0">
                  <ChallengeStepProgress
                    steps={challenge.steps}
                    currentIndex={currentStepIndex}
                    listAriaLabel={progressAria}
                    m={ch}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <main
        className={`mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 ${
          inQuestionPhase ? '' : 'pt-4'
        }`}
      >
        {inQuestionPhase ? (
          <div className="motion-safe:animate-fade-in">
            {submitError && (
              <div
                className="px-4 py-3 mb-4 text-sm text-red-800 border shadow-sm rounded-2xl border-red-200/80 bg-white/90"
                role="alert"
              >
                {submitError}
              </div>
            )}
            {challenge.steps[currentStepIndex] && (
              <ChallengeStep
                key={challenge.steps[currentStepIndex]?.id}
                step={challenge.steps[currentStepIndex]}
                onComplete={handleStepComplete}
                isLast={currentStepIndex === challenge.steps.length - 1}
                surface="challengeMint"
              />
            )}
          </div>
        ) : (
          <div className="p-4 border shadow-sm rounded-2xl border-emerald-200/50 bg-white/95 motion-safe:animate-fade-in sm:p-6 md:p-8">
            {submitError && (
              <div className="px-4 py-3 mb-4 text-sm text-red-800 border border-red-200 rounded-lg bg-red-50" role="alert">
                {submitError}
              </div>
            )}
            <ChallengeStep
              key={challenge.steps[currentStepIndex]?.id}
              step={challenge.steps[currentStepIndex]}
              onComplete={handleStepComplete}
              isLast={currentStepIndex === challenge.steps.length - 1}
              surface="default"
            />
          </div>
        )}
      </main>
    </div>
  );
}
