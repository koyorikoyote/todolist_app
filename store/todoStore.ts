import { create } from 'zustand';
import { TodoStore, TodoItem } from '../types';
import { storageService } from '../services/storageService';

const MAX_DESCRIPTION_LENGTH = 500;

const SAMPLE_TODOS: Omit<TodoItem, 'id' | 'createdAt'>[] = [
    {
        description: 'Task 1: Create a secure TODO app',
        isCompleted: false,
    },
    {
        description: 'Task 2: Swipe left on any task to delete it',
        isCompleted: false,
    },
    {
        description: 'Task 3: Tap the checkbox to toggle completion, tap the text to edit',
        isCompleted: true,
    },
];

// Generate unique ID using timestamp + random string
const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

export const useTodoStore = create<TodoStore>((set, get) => ({
    todos: [],
    isLoading: false,
    error: null,

    addTodo: async (description: string): Promise<void> => {
        const trimmedDescription = description.trim();

        // Validate description before adding
        if (trimmedDescription.length === 0) {
            throw new Error('Description cannot be empty');
        }

        if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
            throw new Error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
        }

        set({ isLoading: true, error: null });

        try {
            const newTodo: TodoItem = {
                id: generateId(),
                description: trimmedDescription,
                isCompleted: false,
                createdAt: Date.now(),
            };

            const updatedTodos = [...get().todos, newTodo];
            await storageService.saveTodos(updatedTodos);

            set({ todos: updatedTodos, isLoading: false });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to add TODO';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    updateTodo: async (id: string, description: string): Promise<void> => {
        const trimmedDescription = description.trim();

        // Validate description before updating
        if (trimmedDescription.length === 0) {
            throw new Error('Description cannot be empty');
        }

        if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
            throw new Error(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
        }

        set({ isLoading: true, error: null });

        try {
            const updatedTodos = get().todos.map(todo =>
                todo.id === id ? { ...todo, description: trimmedDescription } : todo
            );

            await storageService.saveTodos(updatedTodos);
            set({ todos: updatedTodos, isLoading: false });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to update TODO';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    toggleTodo: async (id: string): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
            const updatedTodos = get().todos.map(todo =>
                todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
            );

            await storageService.saveTodos(updatedTodos);
            set({ todos: updatedTodos, isLoading: false });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to toggle TODO';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    deleteTodo: async (id: string): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
            const updatedTodos = get().todos.filter(todo => todo.id !== id);
            await storageService.saveTodos(updatedTodos);
            set({ todos: updatedTodos, isLoading: false });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete TODO';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    loadTodos: async (): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
            const todos = await storageService.loadTodos();
            set({ todos, isLoading: false });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load TODOs';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Initialize with sample data on first launch, otherwise load existing data
    initializeWithSampleData: async (): Promise<void> => {
        set({ isLoading: true, error: null });

        try {
            const isFirstLaunch = await storageService.isFirstLaunch();

            if (isFirstLaunch) {
                const sampleTodos: TodoItem[] = SAMPLE_TODOS.map(todo => ({
                    ...todo,
                    id: generateId(),
                    createdAt: Date.now(),
                }));

                await storageService.saveTodos(sampleTodos);
                await storageService.setFirstLaunchComplete();
                set({ todos: sampleTodos, isLoading: false });
            } else {
                await get().loadTodos();
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to initialize data';
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },
}));
