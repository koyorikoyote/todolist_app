/* eslint-disable import/first */
jest.mock('react-native', () => ({
    Platform: { OS: 'android' },
}));

jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
    digestStringAsync: jest.fn().mockResolvedValue('mock-hash-key'),
    CryptoDigestAlgorithm: { SHA256: 'SHA256' },
}));

jest.mock('expo-local-authentication', () => ({
    hasHardwareAsync: jest.fn(),
    isEnrolledAsync: jest.fn(),
    supportedAuthenticationTypesAsync: jest.fn(),
    authenticateAsync: jest.fn(),
    AuthenticationType: {
        FACIAL_RECOGNITION: 1,
        FINGERPRINT: 2,
        IRIS: 3,
    },
}));

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';
/* eslint-enable import/first */

describe('Android-Specific Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should use expo-secure-store on Android platform', async () => {
        expect(Platform.OS).toBe('android');

        const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
        mockSetItemAsync.mockResolvedValue(undefined);

        await storageService.setItem('test-key', 'test-value');

        expect(mockSetItemAsync).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should persist TODO items to Android KeyStore', async () => {
        const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
        mockSetItemAsync.mockResolvedValue(undefined);

        const todos = [{
            id: '1',
            description: 'Test TODO',
            isCompleted: false,
            createdAt: Date.now(),
        }];

        await storageService.saveTodos(todos);

        expect(mockSetItemAsync).toHaveBeenCalledWith(
            'secure_todo_app.todos',
            JSON.stringify(todos)
        );
    });

    it('should detect fingerprint availability on Android', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
            LocalAuthentication.AuthenticationType.FINGERPRINT,
        ]);

        const result = await authService.checkBiometricAvailability();

        expect(result.available).toBe(true);
        expect(result.biometricType).toBe('fingerprint');
    });

    it('should authenticate with fingerprint on Android', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
            LocalAuthentication.AuthenticationType.FINGERPRINT,
        ]);
        (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

        const result = await authService.authenticate();

        expect(result.success).toBe(true);
    });

    it('should handle Android KeyStore errors gracefully', async () => {
        const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
        mockSetItemAsync.mockRejectedValue(new Error('KeyStore access denied'));

        await expect(storageService.setItem('test-key', 'test-value')).rejects.toThrow(
            'Failed to save item'
        );
    });
});
