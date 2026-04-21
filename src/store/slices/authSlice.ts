import { User, GamificationApiUser } from '../../types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';



interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: true,
  error: null,
};

// Load user and token from localStorage on init
const loadUserFromStorage = (): User | null => {
  const savedUser = localStorage.getItem('practikal-user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      return null;
    }
  }
  return null;
};


// The API actions (login/register) are now handled in separate RTK hooks in Login.tsx



const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('practikal-token');
      localStorage.removeItem('practikal-user');
    },

    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.loading = false;
    },

    setCompletedChallengesFromIds: (state, action: PayloadAction<string[]>) => {
      if (!state.user) return;
      const next: User = {
        ...state.user,
        completedChallenges: action.payload,
      };
      state.user = next;
      localStorage.setItem('practikal-user', JSON.stringify(next));
    },

    /** Keeps `user.completedChallenges` in sync when the user passes a challenge locally */
    recordChallengePassed: (state, action: PayloadAction<string>) => {
      if (!state.user) return;
      const challengeId = action.payload;
      if (state.user.completedChallenges.includes(challengeId)) return;
      const next: User = {
        ...state.user,
        completedChallenges: [...state.user.completedChallenges, challengeId],
      };
      state.user = next;
      localStorage.setItem('practikal-user', JSON.stringify(next));
    },

    mergeGamificationFromApi: (state, action: PayloadAction<GamificationApiUser>) => {
      if (!state.user) return;
      const g = action.payload;
      const next: User = {
        ...state.user,
        xp: typeof g.gamification_xp === 'number' ? g.gamification_xp : state.user.xp,
        level: typeof g.gamification_level === 'string' ? g.gamification_level : state.user.level,
        xpToNextLevel:
          typeof g.gamification_xp_to_next === 'number' ? g.gamification_xp_to_next : state.user.xpToNextLevel,
        reputation: typeof g.gamification_reputation === 'number' ? g.gamification_reputation : state.user.reputation,
        streak: typeof g.gamification_streak === 'number' ? g.gamification_streak : state.user.streak,
      };
      state.user = next;
      localStorage.setItem('practikal-user', JSON.stringify(next));
    },
  },
  extraReducers: () => {
    // Handling is now done directly in the component via mutation results
  },

});

// Initialize state with user from localStorage
const initializedState = {
  ...initialState,
  user: loadUserFromStorage(),
  loading: false,
};

export const { logout, setUser, mergeGamificationFromApi, setCompletedChallengesFromIds, recordChallengePassed } =
  authSlice.actions;
export default authSlice.reducer;

// Export the initialized state for the store
export { initializedState as authInitialState };
