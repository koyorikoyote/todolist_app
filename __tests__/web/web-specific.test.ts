/* eslint-disable import/first */
jest.mock('react-native', () => ({
    Platform: { OS: 'web' },
}));

const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value; },
        removeItem: (key: string) => { delete store[key]; },
        clear: () => { store = {}; },
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

global.btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
global.atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
    digestStringAsync: jest.fn((algorithm: string, data: string) => {
        return Promise.resolve(`mock-hash-${data.substring(0, 10)}`);
    }),
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
import * as Crypto from 'expo-crypto';
import * as LocalAuthentication from 'expo-local-authentication';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';
/* eslint-enable import/first */

describe('Web-Specific Functionality', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    it('should use localStorage on web platform', async () => {
        expect(Platform.OS).toBe('web');

        await storageService.setItem('test-key', 'test-value');

        const storedValue = localStorage.getItem('test-key');
        expect(storedValue).toBeTruthy();
        expect(storedValue).not.toBe('test-value');
    });

    it('should encrypt data before storing in localStorage', async () => {
        const mockDigestStringAsync = Crypto.digestStringAsync as jest.Mock;

        await storageService.setItem('test-key', 'sensitive-data');

        const storedValue = localStorage.getItem('test-key');
        expect(storedValue).toBeTruthy();
        expect(storedValue).toContain(':');
        expect(mockDigestStringAsync).toHaveBeenCalled();
    });

    it('should decrypt data when retrieving from localStorage', async () => {
        const originalValue = 'my-secret-data';
        await storageService.setItem('test-key', originalValue);

        const retrievedValue = await storageService.getItem('test-key');
        expect(retrievedValue).toBe(originalValue);
    });

    it('should detect biometric unavailability on web', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);

        const result = await authService.checkBiometricAvailability();

        expect(result.available).toBe(false);
        expect(result.biometricType).toBe('none');
    });

    it('should fallback to PIN authentication on web', async () => {
        (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
        (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
        (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({ success: true });

        const result = await authService.authenticate();

        expect(result.success).toBe(true);
        expect(LocalAuthentication.authenticateAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                promptMessage: 'Use your device PIN to access your TODO list',
            })
        );
    });

    it('should handle invalid encrypted data format', async () => {
        localStorage.setItem('test-key', 'invalid-format-no-colon');

        await expect(storageService.getItem('test-key')).rejects.toThrow(
            'Invalid encrypted data format'
        );
    });
});
