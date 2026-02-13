/* eslint-disable import/first */
jest.mock('expo-secure-store', () => ({
    setItemAsync: jest.fn(),
    getItemAsync: jest.fn(),
    deleteItemAsync: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
    digestStringAsync: jest.fn().mockResolvedValue('mock-hash-key'),
    CryptoDigestAlgorithm: {
        SHA256: 'SHA256',
    },
}));

jest.mock('react-native', () => ({
    Platform: {
        OS: 'ios',
    },
}));

import { storageService } from '../../services/storageService';
import * as SecureStore from 'expo-secure-store';
import { TodoItem } from '../../types';
/* eslint-enable import/first */

describe('StorageService Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should throw error when SecureStore.setItemAsync fails', async () => {
        const mockError = new Error('Storage quota exceeded');
        (SecureStore.setItemAsync as jest.Mock)
            .mockRejectedValueOnce(mockError)
            .mockRejectedValueOnce(mockError);

        await expect(
            storageService.setItem('test-key', 'test-value')
        ).rejects.toThrow('Failed to save item: Storage quota exceeded');
    });

    it('should throw error when stored data is not valid JSON', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce('invalid-json{]');

        await expect(
            storageService.loadTodos()
        ).rejects.toThrow('Failed to parse stored TODO items');
    });

    it('should return empty array when no todos are stored', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

        const result = await storageService.loadTodos();
        expect(result).toEqual([]);
    });

    it('should propagate error when setItem fails during saveTodos', async () => {
        const mockError = new Error('Storage full');
        (SecureStore.setItemAsync as jest.Mock)
            .mockRejectedValueOnce(mockError)
            .mockRejectedValueOnce(mockError);

        const todos: TodoItem[] = [{
            id: '123',
            description: 'Test todo',
            isCompleted: false,
            createdAt: Date.now(),
        }];

        await expect(
            storageService.saveTodos(todos)
        ).rejects.toThrow('Failed to save TODO items');
    });

    it('should return true when first launch flag is not set', async () => {
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(null);

        const result = await storageService.isFirstLaunch();

        expect(result).toBe(true);
    });

    it('should handle large TODO arrays', async () => {
        const largeTodoArray: TodoItem[] = Array.from({ length: 1000 }, (_, i) => ({
            id: `todo-${i}`,
            description: `Task ${i}`,
            isCompleted: i % 2 === 0,
            createdAt: Date.now() + i,
        }));

        (SecureStore.setItemAsync as jest.Mock).mockResolvedValueOnce(undefined);
        (SecureStore.getItemAsync as jest.Mock).mockResolvedValueOnce(
            JSON.stringify(largeTodoArray)
        );

        await storageService.saveTodos(largeTodoArray);
        const loaded = await storageService.loadTodos();

        expect(loaded).toHaveLength(1000);
        expect(loaded[0].id).toBe('todo-0');
        expect(loaded[999].id).toBe('todo-999');
    });
});
