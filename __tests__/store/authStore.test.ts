import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';

jest.mock('../../services/authService', () => ({
    authService: {
        authenticate: jest.fn(),
    },
}));

describe('AuthStore', () => {
    beforeEach(() => {
        useAuthStore.setState({
            isAuthenticated: false,
            isLoading: false,
            lastAuthTime: null,
            failedAttempts: 0,
        });
        jest.clearAllMocks();
    });

    it('should set authenticated state on successful login', async () => {
        (authService.authenticate as jest.Mock).mockResolvedValue({ success: true });

        const result = await useAuthStore.getState().login();

        expect(result).toBe(true);
        expect(useAuthStore.getState().isAuthenticated).toBe(true);
        expect(useAuthStore.getState().failedAttempts).toBe(0);
    });

    it('should increment failed attempts on failed login', async () => {
        (authService.authenticate as jest.Mock).mockResolvedValue({ success: false });

        const result = await useAuthStore.getState().login();

        expect(result).toBe(false);
        expect(useAuthStore.getState().failedAttempts).toBe(1);
    });

    it('should clear authentication state on logout', () => {
        useAuthStore.setState({
            isAuthenticated: true,
            lastAuthTime: Date.now(),
            failedAttempts: 2,
        });

        useAuthStore.getState().logout();

        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().lastAuthTime).toBe(null);
        expect(useAuthStore.getState().failedAttempts).toBe(0);
    });

    it('should enforce timeout after max failed attempts', () => {
        useAuthStore.setState({
            failedAttempts: 3,
            lastAuthTime: Date.now() - 10000,
        });

        const shouldTimeout = useAuthStore.getState().shouldTimeout();

        expect(shouldTimeout).toBe(true);
    });

    it('should handle multiple failed login attempts correctly', async () => {
        (authService.authenticate as jest.Mock).mockResolvedValue({ success: false });

        await useAuthStore.getState().login();
        await useAuthStore.getState().login();
        await useAuthStore.getState().login();

        expect(useAuthStore.getState().failedAttempts).toBe(3);
        expect(useAuthStore.getState().shouldTimeout()).toBe(true);
    });
});
