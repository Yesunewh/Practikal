import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Challenge, ChallengeAttempt, ActivityLogEntry, UserProgress } from '../types';
import { buildUserProgress } from '../utils/progressCalculations';

interface ProgressContextType {
  currentAttempt: ChallengeAttempt | null;
  startChallenge: (challengeId: string, userId: string) => void;
  completeChallenge: (score: number, passed: boolean) => void;
  updateStepProgress: (stepId: string, answer: string | string[], correct: boolean, timeSpent: number) => void;
  logActivity: (activity: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  getActivityLog: (userId: string) => ActivityLogEntry[];
  calculateProgress: (userId: string, challenges?: Challenge[]) => UserProgress;
  trackTime: boolean;
  startTime: number;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [currentAttempt, setCurrentAttempt] = useState<ChallengeAttempt | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [trackTime, setTrackTime] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const startChallenge = (challengeId: string, userId: string) => {
    const attempt: ChallengeAttempt = {
      id: `attempt_${Date.now()}`,
      userId,
      challengeId,
      startedAt: new Date(),
      timeSpent: 0,
      score: 0,
      passed: false,
      answers: []
    };

    setCurrentAttempt(attempt);
    setTrackTime(true);
    setStartTime(Date.now());

    // Log activity
    logActivity({
      userId,
      type: 'challenge_started',
      details: {
        challengeId
      }
    });
  };

  const completeChallenge = (score: number, passed: boolean) => {
    if (!currentAttempt) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const completedAttempt: ChallengeAttempt = {
      ...currentAttempt,
      completedAt: new Date(),
      timeSpent,
      score,
      passed
    };

    setCurrentAttempt(completedAttempt);
    setTrackTime(false);

    // Log activity
    logActivity({
      userId: currentAttempt.userId,
      type: 'challenge_completed',
      details: {
        challengeId: currentAttempt.challengeId,
        score,
        timeSpent,
        xpEarned: passed ? score * 10 : 0
      }
    });

    // Store attempt in localStorage (in production, send to backend)
    const attempts = JSON.parse(localStorage.getItem('challengeAttempts') || '[]');
    attempts.push(completedAttempt);
    localStorage.setItem('challengeAttempts', JSON.stringify(attempts));

    // Reset after a delay
    setTimeout(() => {
      setCurrentAttempt(null);
    }, 1000);
  };

  const updateStepProgress = (stepId: string, answer: string | string[], correct: boolean, timeSpent: number) => {
    if (!currentAttempt) return;

    const updatedAttempt = {
      ...currentAttempt,
      answers: [
        ...currentAttempt.answers,
        {
          stepId,
          answer,
          correct,
          timeSpent
        }
      ]
    };

    setCurrentAttempt(updatedAttempt);
  };

  const logActivity = (activity: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => {
    const newActivity: ActivityLogEntry = {
      ...activity,
      id: `activity_${Date.now()}`,
      timestamp: new Date()
    };

    setActivityLog(prev => [newActivity, ...prev]);

    // Store in localStorage (in production, send to backend)
    const storedLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    storedLog.unshift(newActivity);
    localStorage.setItem('activityLog', JSON.stringify(storedLog.slice(0, 100))); // Keep last 100
  };

  const getActivityLog = (userId: string): ActivityLogEntry[] => {
    return activityLog.filter(activity => activity.userId === userId);
  };

  const calculateProgress = (userId: string, challenges?: Challenge[]): UserProgress => {
    const rawAttempts = JSON.parse(localStorage.getItem('challengeAttempts') || '[]');
    let challengeList = challenges;
    if (!challengeList || challengeList.length === 0) {
      const saved =
        localStorage.getItem('practikal-challenges') || localStorage.getItem('guardey-challenges');
      challengeList = saved ? JSON.parse(saved) : [];
    }
    return buildUserProgress(userId, challengeList, rawAttempts);
  };

  // Load activity log from localStorage on mount
  useEffect(() => {
    const storedLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
    setActivityLog(storedLog);
  }, []);

  return (
    <ProgressContext.Provider
      value={{
        currentAttempt,
        startChallenge,
        completeChallenge,
        updateStepProgress,
        logActivity,
        getActivityLog,
        calculateProgress,
        trackTime,
        startTime
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
