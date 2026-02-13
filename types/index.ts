// Core data models
export interface TodoItem {
    id: string;
    description: string;
    isCompleted: boolean;
    createdAt: number;
}

// Storage Service interfaces
export interface StorageService {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    deleteItem(key: string): Promise<void>;
    saveTodos(todos: TodoItem[]): Promise<void>;
    loadTodos(): Promise<TodoItem[]>;
    isFirstLaunch(): Promise<boolean>;
    setFirstLaunchComplete(): Promise<void>;
}

// Authentication Service interfaces
export interface BiometricAvailability {
    available: boolean;
    biometricType: 'fingerprint' | 'facial' | 'iris' | 'none';
}

export interface AuthenticationResult {
    success: boolean;
    error?: string;
}

export interface AuthenticationOptions {
    promptMessage?: string;
    cancelLabel?: string;
    fallbackLabel?: string;
}

export interface AuthService {
    checkBiometricAvailability(): Promise<BiometricAvailability>;
    authenticate(options?: AuthenticationOptions): Promise<AuthenticationResult>;
    hasHardwareAsync(): Promise<boolean>;
    isEnrolledAsync(): Promise<boolean>;
}

// Zustand Store interfaces
export interface TodoStore {
    todos: TodoItem[];
    isLoading: boolean;
    error: string | null;
    addTodo: (description: string) => Promise<void>;
    toggleTodo: (id: string) => Promise<void>;
    deleteTodo: (id: string) => Promise<void>;
    loadTodos: () => Promise<void>;
    initializeWithSampleData: () => Promise<void>;
}

export interface AuthStore {
    isAuthenticated: boolean;
    isLoading: boolean;
    lastAuthTime: number | null;
    failedAttempts: number;
    login: () => Promise<boolean>;
    logout: () => void;
    checkAuthStatus: () => boolean;
    incrementFailedAttempts: () => void;
    resetFailedAttempts: () => void;
    shouldTimeout: () => boolean;
}
