/**
 * Gamification API is on by default when the user is logged in.
 * Set VITE_USE_GAMIFICATION_API=false to force mock/localStorage-only behavior.
 */
export const useGamificationApi = import.meta.env.VITE_USE_GAMIFICATION_API !== 'false';
