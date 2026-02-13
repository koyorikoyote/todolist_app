import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTodoStore } from '../../store/todoStore';
import { useAuthStore } from '../../store/authStore';
import TodoList from '../../components/TodoList';

const YELLOW_PRIMARY = '#FFD700';
const YELLOW_LIGHT = '#FFF9E6';

export default function TodoScreen() {
  const { todos, isLoading, error, addTodo, initializeWithSampleData } = useTodoStore();
  const { isAuthenticated } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [newTodoDescription, setNewTodoDescription] = useState('');
  const [isAddingTodo, setIsAddingTodo] = useState(false);

  // Load TODOs on mount (sample data on first launch, existing data otherwise)
  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeWithSampleData();
      } catch {
        // Error handled by store
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddTodo = async () => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please authenticate to add TODO items.');
      return;
    }

    const trimmedDescription = newTodoDescription.trim();
    if (!trimmedDescription) {
      Alert.alert('Invalid Input', 'Please enter a description for your TODO item.');
      return;
    }

    setIsAddingTodo(true);
    try {
      await addTodo(trimmedDescription);
      setNewTodoDescription('');
      setModalVisible(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add TODO';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsAddingTodo(false);
    }
  };

  const handleOpenModal = () => {
    if (!isAuthenticated) {
      Alert.alert('Authentication Required', 'Please authenticate to add TODO items.');
      return;
    }
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setNewTodoDescription('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TODO List</Text>
        <Text style={styles.headerSubtitle}>
          {todos.length} {todos.length === 1 ? 'task' : 'tasks'}
        </Text>
      </View>

      {isLoading && todos.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={YELLOW_PRIMARY} />
          <Text style={styles.loadingText}>Loading your TODOs...</Text>
        </View>
      ) : (
        <TodoList todos={todos} />
      )}

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.addButton}
        onPress={handleOpenModal}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New TODO</Text>
              <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Enter TODO description..."
              placeholderTextColor="#999"
              value={newTodoDescription}
              onChangeText={setNewTodoDescription}
              multiline
              maxLength={500}
              autoFocus
            />

            <Text style={styles.characterCount}>
              {newTodoDescription.length}/500
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCloseModal}
                disabled={isAddingTodo}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.addModalButton,
                  isAddingTodo && styles.addModalButtonDisabled,
                ]}
                onPress={handleAddTodo}
                disabled={isAddingTodo}
              >
                {isAddingTodo ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Text style={styles.addModalButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: YELLOW_LIGHT,
  },
  header: {
    backgroundColor: YELLOW_PRIMARY,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: YELLOW_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  addButtonText: {
    fontSize: 36,
    color: '#333',
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    minHeight: 300,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    backgroundColor: '#F9F9F9',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addModalButton: {
    backgroundColor: YELLOW_PRIMARY,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addModalButtonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  addModalButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});
