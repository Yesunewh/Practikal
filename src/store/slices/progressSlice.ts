import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Challenge, ChallengeAttempt, ActivityLogEntry, UserProgress } from '../../types';
import { challengeAttemptCountsAsPassed } from '../../constants/challenges';
import { buildUserProgress, reviveAttempts } from '../../utils/progressCalculations';
import { logout } from './authSlice';

interface ProgressState {
  currentAttempt: ChallengeAttempt | null;
  activityLog: ActivityLogEntry[];
  trackTime: boolean;
  startTime: number;
  /** Server-backed attempts for the logged-in user; when set, overrides localStorage for selectors */
  remoteAttempts: ChallengeAttempt[] | null;
}

const initialState: ProgressState = {
  currentAttempt: null,
  activityLog: [],
  trackTime: false,
  startTime: 0,
  remoteAttempts: null,
};

const loadActivityLogFromStorage = (): ActivityLogEntry[] => {
  const storedLog = localStorage.getItem('activityLog');
  if (storedLog) {
    try {
      return JSON.parse(storedLog);
    } catch (e) {
      return [];
    }
  }
  return [];
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    startChallenge: (state, action: PayloadAction<{ challengeId: string; userId: string }>) => {
      const { challengeId, userId } = action.payload;
      const attempt: ChallengeAttempt = {
        id: `attempt_${Date.now()}`,
        userId,
        challengeId,
        startedAt: new Date().toISOString(),
        timeSpent: 0,
        score: 0,
        passed: false,
        answers: []
      };

      state.currentAttempt = attempt;
      state.trackTime = true;
      state.startTime = Date.now();

      // Log activity
      const activity: ActivityLogEntry = {
        id: `activity_${Date.now()}`,
        userId,
        type: 'challenge_started',
        timestamp: new Date().toISOString(),
        details: {
          challengeId
        }
      };
      state.activityLog.unshift(activity);
      
      // Store in localStorage
      const storedLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
      storedLog.unshift(activity);
      localStorage.setItem('activityLog', JSON.stringify(storedLog.slice(0, 100)));
    },
    completeChallenge: (state, action: PayloadAction<{ score: number; passed: boolean }>) => {
      if (!state.currentAttempt) return;

      const { score, passed } = action.payload;
      const timeSpent = Math.floor((Date.now() - state.startTime) / 1000);
      const completedAttempt: ChallengeAttempt = {
        ...state.currentAttempt,
        completedAt: new Date().toISOString(),
        timeSpent,
        score,
        passed
      };

      state.currentAttempt = completedAttempt;
      state.trackTime = false;

      // Log activity
      const activity: ActivityLogEntry = {
        id: `activity_${Date.now()}`,
        userId: state.currentAttempt.userId,
        type: 'challenge_completed',
        timestamp: new Date().toISOString(),
        details: {
          challengeId: state.currentAttempt.challengeId,
          score,
          timeSpent,
          xpEarned: passed ? score * 10 : 0
        }
      };
      state.activityLog.unshift(activity);

      if (state.remoteAttempts != null) {
        state.remoteAttempts.push(completedAttempt);
      } else {
        const attempts = JSON.parse(localStorage.getItem('challengeAttempts') || '[]');
        attempts.push(completedAttempt);
        localStorage.setItem('challengeAttempts', JSON.stringify(attempts));
      }

      // Store activity log
      const storedLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
      storedLog.unshift(activity);
      localStorage.setItem('activityLog', JSON.stringify(storedLog.slice(0, 100)));

      // Reset after a delay (this will be handled by component)
      state.currentAttempt = null;
    },
    updateStepProgress: (state, action: PayloadAction<{ stepId: string; answer: string | string[]; correct: boolean; timeSpent: number }>) => {
      if (!state.currentAttempt) return;

      const { stepId, answer, correct, timeSpent } = action.payload;
      state.currentAttempt.answers.push({
        stepId,
        answer,
        correct,
        timeSpent
      });
    },
    logActivity: (state, action: PayloadAction<Omit<ActivityLogEntry, 'id' | 'timestamp'>>) => {
      const newActivity: ActivityLogEntry = {
        ...action.payload,
        id: `activity_${Date.now()}`,
        timestamp: new Date().toISOString()
      };

      state.activityLog.unshift(newActivity);

      // Store in localStorage
      const storedLog = JSON.parse(localStorage.getItem('activityLog') || '[]');
      storedLog.unshift(newActivity);
      localStorage.setItem('activityLog', JSON.stringify(storedLog.slice(0, 100)));
    },
    setCurrentAttempt: (state, action: PayloadAction<ChallengeAttempt | null>) => {
      state.currentAttempt = action.payload;
    },
    initializeProgress: (state) => {
      state.activityLog = loadActivityLogFromStorage();
    },
    calculateProgress: (_state, _action: PayloadAction<{ userId: string; challenges?: Challenge[] }>) => {
      // This is a computed value, will be handled by a selector
      return _state;
    },
    setRemoteChallengeAttempts: (state, action: PayloadAction<ChallengeAttempt[] | null>) => {
      state.remoteAttempts = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, (state) => {
      state.remoteAttempts = null;
    });
  },
});

export const {
  startChallenge,
  completeChallenge,
  updateStepProgress,
  logActivity,
  setCurrentAttempt,
  initializeProgress,
  calculateProgress,
  setRemoteChallengeAttempts,
} = progressSlice.actions;
export default progressSlice.reducer;

type ProgressSliceSelectorState = { progress: ProgressState; challenges: { challenges: Challenge[] } };

function rawAttemptsForState(state: ProgressSliceSelectorState): unknown[] {
  if (state.progress.remoteAttempts != null) {
    return state.progress.remoteAttempts;
  }
  return JSON.parse(localStorage.getItem('challengeAttempts') || '[]');
}

export const selectUserProgress =
  (userId: string, challenges?: Challenge[]) =>
  (state: ProgressSliceSelectorState): UserProgress => {
    let challengeList = challenges ?? state.challenges.challenges;
    if (challengeList.length === 0) {
      const saved = localStorage.getItem('practikal-challenges') || localStorage.getItem('guardey-challenges');
      challengeList = saved ? JSON.parse(saved) : [];
    }
    return buildUserProgress(userId, challengeList, rawAttemptsForState(state));
  };

export const selectChallengeAttemptsRaw = (state: ProgressSliceSelectorState): unknown[] =>
  rawAttemptsForState(state);

export const selectPassedChallengeIds =
  (userId: string) =>
  (state: ProgressSliceSelectorState): Set<string> => {
    const attempts = reviveAttempts(rawAttemptsForState(state)).filter(
      (a) => a.userId === userId && a.passed && a.completedAt,
    );
    return new Set(attempts.map((a) => a.challengeId));
  };

/** Per-challenge: pass status, best score, and attempt count (for progress UI) */
export type ChallengeCompletionSummary = {
  passed: boolean;
  bestScore: number;
  attempts: number;
};

export const selectChallengeSummariesForUser =
  (userId: string) =>
  (state: ProgressSliceSelectorState): Record<string, ChallengeCompletionSummary> => {
    const attempts = reviveAttempts(rawAttemptsForState(state)).filter(
      (a) => a.userId === userId && a.completedAt,
    );
    const map: Record<string, ChallengeCompletionSummary> = {};
    for (const a of attempts) {
      const cur = map[a.challengeId];
      const bestScore = Math.max(cur?.bestScore ?? 0, a.score);
      const passed =
        Boolean(cur?.passed) || challengeAttemptCountsAsPassed(a);
      const attemptCount = (cur?.attempts ?? 0) + 1;
      map[a.challengeId] = { passed, bestScore, attempts: attemptCount };
    }
    return map;
  };
