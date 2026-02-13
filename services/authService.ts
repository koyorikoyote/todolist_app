import * as LocalAuthentication from 'expo-local-authentication';
import {
    AuthService,
    BiometricAvailability,
    AuthenticationResult,
    AuthenticationOptions,
} from '../types';

class AuthenticationService implements AuthService {
    private readonly TIMEOUT_DURATION = 30000;
    private readonly MAX_FAILED_ATTEMPTS = 3;
    private failedAttempts = 0;
    private timeoutUntil: number | null = null;

    async checkBiometricAvailability(): Promise<BiometricAvailability> {
        try {
            const hasHardware = await this.hasHardwareAsync();
            const isEnrolled = await this.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                return {
                    available: false,
                    biometricType: 'none',
                };
            }

            const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

            let biometricType: 'fingerprint' | 'facial' | 'iris' | 'none' = 'none';

            if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                biometricType = 'facial';
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                biometricType = 'fingerprint';
            } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
                biometricType = 'iris';
            }

            return {
                available: biometricType !== 'none',
                biometricType,
            };
        } catch (error) {
            if (__DEV__) {
                console.error('[AuthService] Biometric availability check error:', error);
            }
            return {
                available: false,
                biometricType: 'none',
            };
        }
    }

    async authenticate(options?: AuthenticationOptions): Promise<AuthenticationResult> {
        try {
            // Enforce timeout after 3 failed attempts
            if (this.isInTimeout()) {
                const remainingTime = Math.ceil((this.timeoutUntil! - Date.now()) / 1000);
                return {
                    success: false,
                    error: `Too many failed attempts. Please wait ${remainingTime} seconds before trying again.`,
                };
            }

            const availability = await this.checkBiometricAvailability();

            // Use biometric or PIN prompt based on availability
            const promptMessage = options?.promptMessage ||
                (availability.available
                    ? 'Authenticate to access your TODO list'
                    : 'Use your device PIN to access your TODO list');

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage,
                cancelLabel: options?.cancelLabel || 'Cancel',
                fallbackLabel: options?.fallbackLabel || 'Use PIN',
                disableDeviceFallback: false,
            });

            if (result.success) {
                this.resetFailedAttempts();
                return {
                    success: true,
                };
            } else {
                this.incrementFailedAttempts();

                // Start timeout after 3 failed attempts
                if (this.failedAttempts >= this.MAX_FAILED_ATTEMPTS) {
                    this.startTimeout();
                    return {
                        success: false,
                        error: 'Too many failed attempts. Please wait 30 seconds before trying again.',
                    };
                }

                return {
                    success: false,
                    error: result.error === 'user_cancel'
                        ? 'Authentication cancelled'
                        : 'Authentication failed. Please try again.',
                };
            }
        } catch (error) {
            if (__DEV__) {
                console.error('[AuthService] Authentication error:', error);
            }

            // Fallback to PIN on system error
            try {
                const hasDeviceCredential = await LocalAuthentication.isEnrolledAsync();
                if (hasDeviceCredential) {
                    return {
                        success: false,
                        error: 'Authentication system error. Please use your device PIN.',
                    };
                }
            } catch (fallbackError) {
                if (__DEV__) {
                    console.error('[AuthService] Fallback check error:', fallbackError);
                }
            }

            return {
                success: false,
                error: 'Authentication system error. Please try again.',
            };
        }
    }

    async hasHardwareAsync(): Promise<boolean> {
        try {
            return await LocalAuthentication.hasHardwareAsync();
        } catch (error) {
            if (__DEV__) {
                console.error('[AuthService] Hardware check error:', error);
            }
            return false;
        }
    }

    async isEnrolledAsync(): Promise<boolean> {
        try {
            return await LocalAuthentication.isEnrolledAsync();
        } catch (error) {
            if (__DEV__) {
                console.error('[AuthService] Enrollment check error:', error);
            }
            return false;
        }
    }

    private isInTimeout(): boolean {
        if (this.timeoutUntil === null) {
            return false;
        }

        if (Date.now() >= this.timeoutUntil) {
            this.timeoutUntil = null;
            this.resetFailedAttempts();
            return false;
        }

        return true;
    }

    private startTimeout(): void {
        this.timeoutUntil = Date.now() + this.TIMEOUT_DURATION;
    }

    private incrementFailedAttempts(): void {
        this.failedAttempts++;
    }

    private resetFailedAttempts(): void {
        this.failedAttempts = 0;
        this.timeoutUntil = null;
    }

    // Remove sensitive details from error messages before showing to users
    private sanitizeErrorMessage(error: unknown): string {
        if (typeof error === 'string') {
            return this.removeInternalDetails(error);
        }

        if (error instanceof Error) {
            return this.removeInternalDetails(error.message);
        }

        return 'An unexpected error occurred';
    }

    // Strip file paths, stack traces, and internal module names from error messages
    private removeInternalDetails(message: string): string {
        let sanitized = message.replace(/\/[\w\-./]+\.(ts|js|tsx|jsx)/gi, '[file]');
        sanitized = sanitized.replace(/at\s+[\w.<>]+\s+\([^)]+\)/gi, '');
        sanitized = sanitized.replace(/^\s*at\s+.*/gm, '');
        sanitized = sanitized.replace(/:\d+:\d+/g, '');
        sanitized = sanitized.replace(/node_modules\/[^\s]+/gi, '[module]');
        sanitized = sanitized.replace(/\s+/g, ' ').trim();

        return sanitized || 'An unexpected error occurred';
    }
}

export const authService = new AuthenticationService();
export default authService;
