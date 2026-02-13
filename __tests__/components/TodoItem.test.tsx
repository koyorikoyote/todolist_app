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
    const mockUpdateTodo = jest.fn();
    const mockDeleteTodo = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();

        mockedUseTodoStore.mockReturnValue({
            toggleTodo: mockToggleTodo,
            updateTodo: mockUpdateTodo,
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

    it('should render completed TODO with checkmark', () => {
        const item: TodoItemType = {
            id: 'test-1',
            description: 'Test completed TODO',
            isCompleted: true,
            createdAt: Date.now(),
        };

        const { getByText } = render(<TodoItem item={item} />);

        expect(getByText('Test completed TODO')).toBeTruthy();
        expect(getByText('✓')).toBeTruthy();
    });

    it('should call toggleTodo when checkbox is pressed', async () => {
        const item: TodoItemType = {
            id: 'test-2',
            description: 'Toggle test',
            isCompleted: false,
            createdAt: Date.now(),
        };

        mockToggleTodo.mockResolvedValue(undefined);

        const { getByTestId } = render(<TodoItem item={item} />);
        const checkboxButton = getByTestId('checkbox-button');

        fireEvent.press(checkboxButton);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockToggleTodo).toHaveBeenCalledWith('test-2');
    });

    it('should open edit modal when description is tapped', () => {
        const item: TodoItemType = {
            id: 'test-3',
            description: 'Edit test',
            isCompleted: false,
            createdAt: Date.now(),
        };

        const { getByTestId, getByText } = render(<TodoItem item={item} />);
        const descriptionButton = getByTestId('description-button');

        fireEvent.press(descriptionButton);

        expect(getByText('Edit TODO')).toBeTruthy();
    });

    it('should call updateTodo when edit is saved', async () => {
        const item: TodoItemType = {
            id: 'test-4',
            description: 'Original description',
            isCompleted: false,
            createdAt: Date.now(),
        };

        mockUpdateTodo.mockResolvedValue(undefined);

        const { getByTestId, getByText, getByPlaceholderText } = render(<TodoItem item={item} />);

        const descriptionButton = getByTestId('description-button');
        fireEvent.press(descriptionButton);

        const input = getByPlaceholderText('Enter TODO description');
        fireEvent.changeText(input, 'Updated description');

        const saveButton = getByText('Save');
        fireEvent.press(saveButton);

        await new Promise(resolve => setTimeout(resolve, 0));

        expect(mockUpdateTodo).toHaveBeenCalledWith('test-4', 'Updated description');
    });

    it('should close edit modal when cancel is pressed', () => {
        const item: TodoItemType = {
            id: 'test-5',
            description: 'Cancel test',
            isCompleted: false,
            createdAt: Date.now(),
        };

        const { getByTestId, getByText, queryByText } = render(<TodoItem item={item} />);

        const descriptionButton = getByTestId('description-button');
        fireEvent.press(descriptionButton);

        expect(getByText('Edit TODO')).toBeTruthy();

        const cancelButton = getByText('Cancel');
        fireEvent.press(cancelButton);

        expect(queryByText('Edit TODO')).toBeNull();
    });

    it('should render delete button in swipeable actions', () => {
        const item: TodoItemType = {
            id: 'test-6',
            description: 'Delete test',
            isCompleted: false,
            createdAt: Date.now(),
        };

        const { getByText } = render(<TodoItem item={item} />);

        expect(getByText('Delete')).toBeTruthy();
    });
});
