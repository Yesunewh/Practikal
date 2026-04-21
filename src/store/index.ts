import { configureStore } from '@reduxjs/toolkit';
import { createLogger } from 'redux-logger';
import authReducer, { authInitialState } from './slices/authSlice';
import challengesReducer, { challengesInitialState } from './slices/challengesSlice';
import campaignsReducer from './slices/campaignsSlice';
import progressReducer from './slices/progressSlice';
import { practikalApi } from './apiSlice/practikalApi';


const logger = createLogger();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    challenges: challengesReducer,
    campaigns: campaignsReducer,
    progress: progressReducer,
    [practikalApi.reducerPath]: practikalApi.reducer,
  },

  preloadedState: {
    auth: authInitialState,
    challenges: challengesInitialState,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(logger as any, practikalApi.middleware),

  devTools: true,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
