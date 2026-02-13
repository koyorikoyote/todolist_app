/* eslint-disable import/first */
jest.mock('expo-local-authentication', () => ({
    hasHardwareAsync: jest.fn(),
    isEnrolledAsync: jest.fn(),
    supportedAuthenticationTypesAsync: jest.fn(),
    authenticateAsync: jest.fn(),
    AuthenticationType: {
        FINGERPRINT: 1,
        FACIAL_RECOGNITION: 2,
        IRIS: 3,
    },
}));

import { authService } from '../../services/authService';
import * as LocalAuthentication from 'expo-local-authentication';
/* eslint-enable import/first */

describe('AuthService Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (authService as any).failedAttempts = 0;
        (authService as any).timeoutUntil = null;
    });

    it('should return available with facial recognition when Face ID is supported', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
        (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValueOnce([
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        ]);

        const result = await authService.checkBiometricAvailability();

        expect(result).toEqual({
            available: true,
            biometricType: 'facial',
        });
    });

    it('should successfully authenticate with biometrics', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        ]);
        (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({
            success: true,
        });

        const result = await authService.authenticate();

        expect(result).toEqual({ success: true });
    });

    it('should handle user cancellation', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
            LocalAuthentication.AuthenticationType.FINGERPRINT,
        ]);
        (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValueOnce({
            success: false,
            error: 'user_cancel',
        });

        const result = await authService.authenticate();

        expect(result).toEqual({
            success: false,
            error: 'Authentication cancelled',
        });
        expect((authService as any).failedAttempts).toBe(1);
    });

    it('should enforce timeout after 3 failed attempts', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
            LocalAuthentication.AuthenticationType.FINGERPRINT,
        ]);
        (LocalAuthentication.authenticateAsync as jest.Mock)
            .mockResolvedValueOnce({ success: false, error: 'authentication_failed' })
            .mockResolvedValueOnce({ success: false, error: 'authentication_failed' })
            .mockResolvedValueOnce({ success: false, error: 'authentication_failed' });

        await authService.authenticate();
        await authService.authenticate();
        const result = await authService.authenticate();

        expect(result).toEqual({
            success: false,
            error: 'Too many failed attempts. Please wait 30 seconds before trying again.',
        });
        expect((authService as any).failedAttempts).toBe(3);
    });

    it('should handle authentication system errors with PIN fallback', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValueOnce(true);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);
        (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValueOnce([
            LocalAuthentication.AuthenticationType.FINGERPRINT,
        ]);
        (LocalAuthentication.authenticateAsync as jest.Mock).mockRejectedValueOnce(
            new Error('Authentication module crashed')
        );
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValueOnce(true);

        const result = await authService.authenticate();

        expect(result).toEqual({
            success: false,
            error: 'Authentication system error. Please use your device PIN.',
        });
    });
});
