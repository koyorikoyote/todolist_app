/* eslint-disable import/first */
jest.mock('react-native', () => ({
    Platform: { OS: 'ios' },
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

describe('iOS-Specific Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should use expo-secure-store on iOS platform', async () => {
        expect(Platform.OS).toBe('ios');

        const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
        mockSetItemAsync.mockResolvedValue(undefined);

        await storageService.setItem('test-key', 'test-value');

        expect(mockSetItemAsync).toHaveBeenCalledWith('test-key', 'test-value');
    });

    it('should persist TODO items to iOS Keychain', async () => {
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

    it('should detect Face ID availability on iOS', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        ]);

        const result = await authService.checkBiometricAvailability();

        expect(result.available).toBe(true);
        expect(result.biometricType).toBe('facial');
    });

    it('should authenticate with Face ID on iOS', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock).mockResolvedValue([
            LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
        ]);
        (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

        const result = await authService.authenticate();

        expect(result.success).toBe(true);
    });

    it('should handle iOS Keychain errors gracefully', async () => {
        const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;
        mockSetItemAsync.mockRejectedValue(new Error('Keychain access denied'));

        await expect(storageService.setItem('test-key', 'test-value')).rejects.toThrow(
            'Failed to save item'
        );
    });

    it('should retry iOS Keychain operations on transient failures', async () => {
        const mockSetItemAsync = SecureStore.setItemAsync as jest.Mock;

        mockSetItemAsync
            .mockRejectedValueOnce(new Error('Temporary failure'))
            .mockResolvedValueOnce(undefined);

        await storageService.setItem('test-key', 'test-value');

        expect(mockSetItemAsync).toHaveBeenCalledTimes(2);
    });
});
