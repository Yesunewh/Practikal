import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Challenge } from '../types';
import { ArrowLeft, Trophy } from 'lucide-react';
import ChallengeStep from './ChallengeStep';
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
      <div className="min-h-screen bg-gray-50 p-8 motion-safe:animate-fade-in">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm text-center motion-safe:animate-fade-in-up">
            <div className="mb-6">
              <Trophy
                className={`mx-auto h-16 w-16 motion-safe:animate-trophy-pop ${passed ? 'text-yellow-400' : 'text-gray-400'}`}
              />
            </div>
            <h2 className="text-2xl font-bold mb-4">
              {passed ? 'Challenge Completed!' : 'Challenge Incomplete'}
            </h2>
            <p className="text-gray-600 mb-6">
              {passed
                ? `Congratulations! You've completed the ${challenge.title} challenge with a score of ${score}%`
                : `You scored ${score}%. You need ${CHALLENGE_PASS_SCORE_PERCENT}% to pass this challenge. Try again!`}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onExit}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 tap-highlight transition-colors"
              >
                Back to Challenges
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-emerald-900 text-white py-6">
        <div className="max-w-3xl mx-auto px-4">
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

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl p-8 shadow-sm motion-safe:animate-fade-in">
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
