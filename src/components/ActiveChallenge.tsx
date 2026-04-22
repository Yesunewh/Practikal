import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Challenge } from '../types';
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

interface ActiveChallengeProps {
  challenge: Challenge;
  onComplete: (success: boolean) => void;
  onExit: () => void;
}

export default function ActiveChallenge({ challenge, onComplete, onExit }: ActiveChallengeProps) {
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
            setSubmitError(typeof msg === 'string' ? msg : 'Could not save your attempt. Please try again.');
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

  if (isComplete) {
    const { score, passed } = outcomeRef.current;

    return (
      <ChallengeCompletionScreen
        passed={passed}
        score={score}
        challengeTitle={challenge.title}
        passThreshold={CHALLENGE_PASS_SCORE_PERCENT}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-emerald-900 text-white py-6">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 2xl:max-w-7xl">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={onExit} className="hover:text-emerald-200">
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-semibold">{challenge.title}</h1>
          </div>
          <div className="flex gap-2">
            {challenge.steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-all duration-500 ease-out ${
                  index <= currentStepIndex ? 'bg-emerald-500' : 'bg-emerald-800'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 2xl:max-w-7xl">
        <div className="rounded-xl bg-white p-4 shadow-sm motion-safe:animate-fade-in sm:p-6 xl:p-8">
          {submitError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {submitError}
            </div>
          )}
          <ChallengeStep
            key={challenge.steps[currentStepIndex]?.id}
            step={challenge.steps[currentStepIndex]}
            onComplete={handleStepComplete}
            isLast={currentStepIndex === challenge.steps.length - 1}
          />
        </div>
      </div>
    </div>
  );
}
