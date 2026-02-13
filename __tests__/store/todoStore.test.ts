import { useTodoStore } from '../../store/todoStore';
import { storageService } from '../../services/storageService';
import { TodoItem } from '../../types';

jest.mock('../../services/storageService');

const mockedStorageService = storageService as jest.Mocked<typeof storageService>;

describe('TodoStore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useTodoStore.setState({ todos: [], isLoading: false, error: null });
    });

    it('should add a new TODO item with valid description', async () => {
        const description = 'Test TODO';
        mockedStorageService.saveTodos.mockResolvedValue();

        await useTodoStore.getState().addTodo(description);

        const todos = useTodoStore.getState().todos;
        expect(todos).toHaveLength(1);
        expect(todos[0].description).toBe(description);
        expect(todos[0].isCompleted).toBe(false);
        expect(mockedStorageService.saveTodos).toHaveBeenCalledWith(todos);
    });

    it('should reject empty descriptions', async () => {
        await expect(useTodoStore.getState().addTodo('   ')).rejects.toThrow('Description cannot be empty');
        expect(useTodoStore.getState().todos).toHaveLength(0);
    });

    it('should toggle TODO completion status twice (round-trip)', async () => {
        const todo: TodoItem = {
            id: 'test-id',
            description: 'Test TODO',
            isCompleted: false,
            createdAt: Date.now(),
        };
        useTodoStore.setState({ todos: [todo] });
        mockedStorageService.saveTodos.mockResolvedValue();

        await useTodoStore.getState().toggleTodo('test-id');
        await useTodoStore.getState().toggleTodo('test-id');

        const todos = useTodoStore.getState().todos;
        expect(todos[0].isCompleted).toBe(false);
    });

    it('should delete TODO item permanently', async () => {
        const todo: TodoItem = {
            id: 'test-id',
            description: 'Test TODO',
            isCompleted: false,
            createdAt: Date.now(),
        };
        useTodoStore.setState({ todos: [todo] });
        mockedStorageService.saveTodos.mockResolvedValue();

        await useTodoStore.getState().deleteTodo('test-id');

        expect(useTodoStore.getState().todos).toHaveLength(0);
        expect(mockedStorageService.saveTodos).toHaveBeenCalledWith([]);
    });

    it('should load TODOs from storage', async () => {
        const todos: TodoItem[] = [
            {
                id: 'test-id-1',
                description: 'Test TODO 1',
                isCompleted: false,
                createdAt: Date.now(),
            },
            {
                id: 'test-id-2',
                description: 'Test TODO 2',
                isCompleted: true,
                createdAt: Date.now(),
            },
        ];
        mockedStorageService.loadTodos.mockResolvedValue(todos);

        await useTodoStore.getState().loadTodos();

        expect(useTodoStore.getState().todos).toEqual(todos);
    });

    it('should create sample data on first launch', async () => {
        mockedStorageService.isFirstLaunch.mockResolvedValue(true);
        mockedStorageService.saveTodos.mockResolvedValue();
        mockedStorageService.setFirstLaunchComplete.mockResolvedValue();

        await useTodoStore.getState().initializeWithSampleData();

        const todos = useTodoStore.getState().todos;
        expect(todos).toHaveLength(3);
        expect(todos[2].isCompleted).toBe(true);
        expect(mockedStorageService.setFirstLaunchComplete).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
        mockedStorageService.saveTodos.mockRejectedValue(new Error('Storage failed'));

        await expect(useTodoStore.getState().addTodo('Test')).rejects.toThrow('Storage failed');
        expect(useTodoStore.getState().error).toBe('Storage failed');
    });
});
