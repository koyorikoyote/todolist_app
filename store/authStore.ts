import { create } from 'zustand';
import { AuthStore } from '../types';
import { authService } from '../services/authService';

const TIMEOUT_DURATION = 30000;
const MAX_FAILED_ATTEMPTS = 3;

export const useAuthStore = create<AuthStore>((set, get) => ({
    isAuthenticated: false,
    isLoading: false,
    lastAuthTime: null,
    failedAttempts: 0,

    login: async (): Promise<boolean> => {
        set({ isLoading: true });

        try {
            const result = await authService.authenticate();

            if (result.success) {
                set({
                    isAuthenticated: true,
                    isLoading: false,
                    lastAuthTime: Date.now(),
                    failedAttempts: 0,
                });
                return true;
            } else {
                get().incrementFailedAttempts();
                set({ isLoading: false, lastAuthTime: Date.now() });
                return false;
            }
        } catch {
            get().incrementFailedAttempts();
            set({ isLoading: false, lastAuthTime: Date.now() });
            return false;
        }
    },

    logout: (): void => {
        set({
            isAuthenticated: false,
            lastAuthTime: null,
            failedAttempts: 0,
        });
    },

    checkAuthStatus: (): boolean => {
        return get().isAuthenticated;
    },

    incrementFailedAttempts: (): void => {
        set((state) => ({
            failedAttempts: state.failedAttempts + 1,
        }));
    },

    resetFailedAttempts: (): void => {
        set({ failedAttempts: 0 });
    },

    // Check if user should be in timeout (3+ failed attempts within 30s)
    shouldTimeout: (): boolean => {
        const { failedAttempts, lastAuthTime } = get();

        if (failedAttempts < MAX_FAILED_ATTEMPTS) {
            return false;
        }

        if (lastAuthTime === null) {
            return true;
        }

        const timeSinceLastAttempt = Date.now() - lastAuthTime;
        return timeSinceLastAttempt < TIMEOUT_DURATION;
    },
}));

export default useAuthStore;
