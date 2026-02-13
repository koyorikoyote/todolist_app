import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TodoItem from '../../components/TodoItem';
import { useTodoStore } from '../../store/todoStore';
import { useAuthStore } from '../../store/authStore';
import { TodoItem as TodoItemType } from '../../types';

jest.mock('../../store/todoStore');
jest.mock('../../store/authStore');
jest.mock('expo-haptics');

const mockedUseTodoStore = useTodoStore as jest.MockedFunction<typeof useTodoStore>;
const mockedUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('TodoItem Component', () => {
    const mockToggleTodo = jest.fn();
    const mockDeleteTodo = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockedUseTodoStore.mockReturnValue({
            toggleTodo: mockToggleTodo,
            deleteTodo: mockDeleteTodo,
            todos: [],
            isLoading: false,
            error: null,
            addTodo: jest.fn(),
            loadTodos: jest.fn(),
            initializeWithSampleData: jest.fn(),
        });

        mockedUseAuthStore.mockReturnValue({
            isAuthenticated: true,
            isLoading: false,
            lastAuthTime: null,
            failedAttempts: 0,
            login: jest.fn(),
            logout: jest.fn(),
            checkAuthStatus: jest.fn(),
            incrementFailedAttempts: jest.fn(),
            resetFailedAttempts: jest.fn(),
            shouldTimeout: jest.fn(),
        });
    });

    it('should render incomplete TODO item correctly', () => {
        const item: TodoItemType = {
            id: 'test-1',
            description: 'Test incomplete TODO',
            isCompleted: false,
            createdAt: Date.now(),
        };

        const { getByText, queryByText } = render(<TodoItem item={item} />);

        expect(getByText('Test incomplete TODO')).toBeTruthy();
        expect(queryByText('✓')).toBeNull();
    });

    it('should render completed TODO item with checkmark', () => {
        const item: TodoItemType = {
            id: 'test-2',
            description: 'Test completed TODO',
            isCompleted: true,
            createdAt: Date.now(),
        };

        const { getByText } = render(<TodoItem item={item} />);

        expect(getByText('Test completed TODO')).toBeTruthy();
        expect(getByText('✓')).toBeTruthy();
    });

    it('should call toggleTodo when item is pressed', async () => {
        const item: TodoItemType = {
            id: 'test-4',
            description: 'Toggle test',
            isCompleted: false,
            createdAt: Date.now(),
        };

        mockToggleTodo.mockResolvedValue(undefined);

        const { getByText } = render(<TodoItem item={item} />);
        const todoItem = getByText('Toggle test');

        fireEvent.press(todoItem);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockToggleTodo).toHaveBeenCalledWith('test-4');
    });

    it('should render delete button in swipeable actions', () => {
        const item: TodoItemType = {
            id: 'test-7',
            description: 'Delete test',
            isCompleted: false,
            createdAt: Date.now(),
        };

        const { getByText } = render(<TodoItem item={item} />);

        expect(getByText('Delete')).toBeTruthy();
    });

    it('should handle errors gracefully', async () => {
        const item: TodoItemType = {
            id: 'test-10',
            description: 'Error test',
            isCompleted: false,
            createdAt: Date.now(),
        };

        mockToggleTodo.mockRejectedValue(new Error('Toggle failed'));

        const { getByText } = render(<TodoItem item={item} />);
        const todoItem = getByText('Error test');

        fireEvent.press(todoItem);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockToggleTodo).toHaveBeenCalledWith('test-10');
    });
});
