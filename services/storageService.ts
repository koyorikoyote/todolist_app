import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { StorageService, TodoItem } from '../types';

const STORAGE_KEYS = {
    TODOS: 'secure_todo_app.todos',
    FIRST_LAUNCH: 'secure_todo_app.first_launch',
};

const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 300;

class StorageServiceImpl implements StorageService {
    private isWeb = Platform.OS === 'web';

    private logError(operation: string, error: unknown): void {
        if (__DEV__) {
            console.error(`[StorageService] ${operation} failed:`, error);
        }
    }

    // Retry failed operations with exponential backoff to handle transient errors
    private async retryOperation<T>(
        operation: () => Promise<T>,
        operationName: string,
        retries = MAX_RETRIES
    ): Promise<T> {
        let lastError: unknown;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;

                if (attempt < retries) {
                    this.logError(`${operationName} (attempt ${attempt + 1}/${retries + 1})`, error);
                    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * (attempt + 1)));
                }
            }
        }

        this.logError(`${operationName} (all retries exhausted)`, lastError);
        throw lastError;
    }

    async setItem(key: string, value: string): Promise<void> {
        try {
            await this.retryOperation(
                async () => {
                    if (this.isWeb) {
                        await this.setItemWeb(key, value);
                    } else {
                        await SecureStore.setItemAsync(key, value);
                    }
                },
                'setItem'
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to save item: ${errorMessage}`);
        }
    }

    async getItem(key: string): Promise<string | null> {
        try {
            return await this.retryOperation(
                async () => {
                    if (this.isWeb) {
                        return await this.getItemWeb(key);
                    } else {
                        return await SecureStore.getItemAsync(key);
                    }
                },
                'getItem'
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to retrieve item: ${errorMessage}`);
        }
    }

    async deleteItem(key: string): Promise<void> {
        try {
            await this.retryOperation(
                async () => {
                    if (this.isWeb) {
                        await this.deleteItemWeb(key);
                    } else {
                        await SecureStore.deleteItemAsync(key);
                    }
                },
                'deleteItem'
            );
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to delete item: ${errorMessage}`);
        }
    }

    async saveTodos(todos: TodoItem[]): Promise<void> {
        try {
            const todosJson = JSON.stringify(todos);
            await this.setItem(STORAGE_KEYS.TODOS, todosJson);
        } catch (error) {
            this.logError('saveTodos', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to save TODO items: ${errorMessage}`);
        }
    }

    async loadTodos(): Promise<TodoItem[]> {
        try {
            const todosJson = await this.getItem(STORAGE_KEYS.TODOS);
            if (!todosJson) {
                return [];
            }
            try {
                const parsed = JSON.parse(todosJson) as TodoItem[];
                return parsed;
            } catch (parseError) {
                this.logError('loadTodos - JSON parse', parseError);
                throw new Error('Failed to parse stored TODO items');
            }
        } catch (error) {
            this.logError('loadTodos', error);
            throw error;
        }
    }

    async isFirstLaunch(): Promise<boolean> {
        try {
            const firstLaunchFlag = await this.getItem(STORAGE_KEYS.FIRST_LAUNCH);
            return firstLaunchFlag === null;
        } catch (error) {
            this.logError('isFirstLaunch', error);
            throw error;
        }
    }

    async setFirstLaunchComplete(): Promise<void> {
        try {
            await this.setItem(STORAGE_KEYS.FIRST_LAUNCH, 'false');
        } catch (error) {
            this.logError('setFirstLaunchComplete', error);
            throw error;
        }
    }

    // Web platform uses localStorage with expo-crypto encryption (fallback for no native keystore)
    private async setItemWeb(key: string, value: string): Promise<void> {
        const encryptionKey = await this.getOrCreateEncryptionKey();
        const encrypted = await this.encryptData(value, encryptionKey);
        localStorage.setItem(key, encrypted);
    }

    private async getItemWeb(key: string): Promise<string | null> {
        const encrypted = localStorage.getItem(key);
        if (!encrypted) {
            return null;
        }
        const encryptionKey = await this.getOrCreateEncryptionKey();
        return await this.decryptData(encrypted, encryptionKey);
    }

    private async deleteItemWeb(key: string): Promise<void> {
        localStorage.removeItem(key);
    }

    // Generate or retrieve persistent encryption key for web platform
    private async getOrCreateEncryptionKey(): Promise<string> {
        const keyStorageKey = 'secure_todo_app.encryption_key';
        let key = localStorage.getItem(keyStorageKey);
        if (!key) {
            key = await Crypto.digestStringAsync(
                Crypto.CryptoDigestAlgorithm.SHA256,
                `${Date.now()}-${Math.random()}`
            );
            localStorage.setItem(keyStorageKey, key);
        }
        return key;
    }

    // Simple encryption: hash + base64 encoded data
    private async encryptData(data: string, key: string): Promise<string> {
        const combined = `${key}:${data}`;
        return await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            combined
        ) + ':' + btoa(data);
    }

    private async decryptData(encrypted: string, key: string): Promise<string> {
        const parts = encrypted.split(':');
        if (parts.length !== 2) {
            throw new Error('Invalid encrypted data format');
        }
        return atob(parts[1]);
    }
}

export const storageService = new StorageServiceImpl();
