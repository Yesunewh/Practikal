import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Challenge } from '../../types';
import { challenges as initialChallenges } from '../../data/mockData';

interface ChallengesState {
  challenges: Challenge[];
}

const initialState: ChallengesState = {
  challenges: [],
};

const loadChallengesFromStorage = (): Challenge[] => {
  const savedChallenges =
    localStorage.getItem('practikal-challenges') || localStorage.getItem('guardey-challenges');
  if (savedChallenges) {
    try {
      return JSON.parse(savedChallenges);
    } catch (e) {
      return initialChallenges;
    }
  }
  return initialChallenges;
};

const challengesSlice = createSlice({
  name: 'challenges',
  initialState,
  reducers: {
    setChallenges: (state, action: PayloadAction<Challenge[]>) => {
      state.challenges = action.payload;
    },
    addChallenge: (state, action: PayloadAction<Challenge>) => {
      state.challenges.push(action.payload);
      localStorage.setItem('practikal-challenges', JSON.stringify(state.challenges));
    },
    updateChallenge: (state, action: PayloadAction<{ id: string; challenge: Challenge }>) => {
      const { id, challenge } = action.payload;
      const index = state.challenges.findIndex(c => c.id === id);
      if (index !== -1) {
        state.challenges[index] = challenge;
        localStorage.setItem('practikal-challenges', JSON.stringify(state.challenges));
      }
    },
    deleteChallenge: (state, action: PayloadAction<string>) => {
      state.challenges = state.challenges.filter(c => c.id !== action.payload);
      localStorage.setItem('practikal-challenges', JSON.stringify(state.challenges));
    },
    initializeChallenges: (state) => {
      state.challenges = loadChallengesFromStorage();
    },
  },
});

// Initialize state with challenges from localStorage
const initializedState = {
  ...initialState,
  challenges: loadChallengesFromStorage(),
};

export const { setChallenges, addChallenge, updateChallenge, deleteChallenge, initializeChallenges } = challengesSlice.actions;
export default challengesSlice.reducer;
export { initializedState as challengesInitialState };
