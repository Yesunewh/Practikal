import { User, GamificationApiUser } from '../../types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { reconcileSessionUser } from '../../utils/authIdentity';

type TokenClaims = {
  user_type?: string;
  permissions?: string[];
  org_id?: string | null;
  dept_id?: string | null;
  unit_id?: string | null;
};

function decodeTokenClaims(token: string | null): TokenClaims | null {
  if (!token) return null;
  try {
    const [, payloadBase64Url] = token.split('.');
    if (!payloadBase64Url) return null;
    const base64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4 || 4)) % 4);
    const json = atob(padded);
    const parsed = JSON.parse(json) as Record<string, unknown>;
    return {
      user_type: typeof parsed.user_type === 'string' ? parsed.user_type : undefined,
      permissions: Array.isArray(parsed.permissions)
        ? parsed.permissions.filter((p): p is string => typeof p === 'string')
        : undefined,
      org_id: typeof parsed.org_id === 'string' ? parsed.org_id : null,
      dept_id: typeof parsed.dept_id === 'string' ? parsed.dept_id : null,
      unit_id: typeof parsed.unit_id === 'string' ? parsed.unit_id : null,
    };
  } catch {
    return null;
  }
}

function hydrateUserFromTokenClaims(user: User, claims: TokenClaims | null): User {
  if (!claims) return user;
  return {
    ...user,
    user_type: user.user_type || claims.user_type,
    permissions: user.permissions?.length ? user.permissions : claims.permissions,
    orgId: user.orgId ?? claims.org_id ?? undefined,
    deptId: user.deptId ?? claims.dept_id ?? undefined,
    unitId: user.unitId ?? claims.unit_id ?? undefined,
  };
}

/** Repair stale `practikal-user` (role vs user_type / permissions); persist when healed. */
function normalizeAuthSnapshot(u: User | null): User | null {
  const next = reconcileSessionUser(u);
  if (!next) return u;
  if (next !== u) {
    try {
      localStorage.setItem('practikal-user', JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }
  return next;
}



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
      const parsed = JSON.parse(savedUser) as User;
      const tokenClaims = decodeTokenClaims(localStorage.getItem('practikal-token'));
      const hydrated = hydrateUserFromTokenClaims(parsed, tokenClaims);
      return normalizeAuthSnapshot(hydrated);
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
      state.user = normalizeAuthSnapshot(action.payload);
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
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (!state.user) return;
      const next: User = { ...state.user, ...action.payload };
      state.user = normalizeAuthSnapshot(next);
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

export const { logout, setUser, mergeGamificationFromApi, setCompletedChallengesFromIds, recordChallengePassed, updateUser } =
  authSlice.actions;
export default authSlice.reducer;

// Export the initialized state for the store
export { initializedState as authInitialState };
