import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useTodoStore } from '../../store/todoStore';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';
import AuthGuard from '../../components/AuthGuard';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useSegments: jest.fn(),
}));

jest.mock('../../services/authService');
jest.mock('../../services/storageService');

describe('App Integration Tests', () => {
  const mockRouter = {
    replace: jest.fn(),
    push: jest.fn(),
    back: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSegments as jest.Mock).mockReturnValue([]);

    useAuthStore.setState({
      isAuthenticated: false,
      isLoading: false,
      lastAuthTime: null,
      failedAttempts: 0,
    });

    useTodoStore.setState({
      todos: [],
      isLoading: false,
      error: null,
    });

    (storageService.isFirstLaunch as jest.Mock).mockResolvedValue(false);
    (storageService.loadTodos as jest.Mock).mockResolvedValue([]);
    (storageService.saveTodos as jest.Mock).mockResolvedValue(undefined);
    (authService.authenticate as jest.Mock).mockResolvedValue({ success: true });
  });

  it('should redirect to login when not authenticated and accessing protected route', async () => {
    (useSegments as jest.Mock).mockReturnValue(['(tabs)']);

    render(<AuthGuard><></></AuthGuard>);

    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
  });

  it('should complete full authentication flow', async () => {
    const { login } = useAuthStore.getState();

    let result: boolean = false;
    await act(async () => {
      result = await login();
    });

    expect(result).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('should initialize with sample data on first launch', async () => {
    (storageService.isFirstLaunch as jest.Mock).mockResolvedValue(true);

    const { initializeWithSampleData } = useTodoStore.getState();

    await act(async () => {
      await initializeWithSampleData();
    });

    const todos = useTodoStore.getState().todos;
    expect(todos).toHaveLength(3);
    expect(storageService.setFirstLaunchComplete).toHaveBeenCalled();
  });

  it('should complete add TODO flow', async () => {
    useAuthStore.setState({ isAuthenticated: true });
    const { addTodo } = useTodoStore.getState();

    await act(async () => {
      await addTodo('New TODO item');
    });

    const todos = useTodoStore.getState().todos;
    expect(todos).toHaveLength(1);
    expect(todos[0].description).toBe('New TODO item');
  });

  it('should complete toggle TODO flow', async () => {
    useAuthStore.setState({ isAuthenticated: true });

    await act(async () => {
      await useTodoStore.getState().addTodo('Test TODO');
    });

    const todoId = useTodoStore.getState().todos[0].id;

    await act(async () => {
      await useTodoStore.getState().toggleTodo(todoId);
    });

    expect(useTodoStore.getState().todos[0].isCompleted).toBe(true);
  });

  it('should handle storage errors gracefully', async () => {
    (storageService.saveTodos as jest.Mock).mockRejectedValue(new Error('Storage failed'));

    const { addTodo } = useTodoStore.getState();

    await expect(
      act(async () => {
        await addTodo('Test TODO');
      })
    ).rejects.toThrow('Storage failed');

    expect(useTodoStore.getState().error).toBe('Storage failed');
  });
});
