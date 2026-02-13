import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { useTodoStore } from '../store/todoStore';
import { useAuthStore } from '../store/authStore';
import { TodoItem as TodoItemType } from '../types';
import EditTodoModal from './EditTodoModal';

const YELLOW_PRIMARY = '#FFD700';

interface TodoItemProps {
  item: TodoItemType;
}

export default function TodoItem({ item }: TodoItemProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const { toggleTodo, updateTodo, deleteTodo } = useTodoStore();
  const { isAuthenticated } = useAuthStore();

  const handleToggle = async () => {
    try {
      if (Platform.OS !== 'web') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await toggleTodo(item.id);
    } catch {
      // Error handled by store
    }
  };

  const handleEdit = () => {
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = async (newDescription: string) => {
    try {
      await updateTodo(item.id, newDescription);
      setIsEditModalVisible(false);
    } catch {
      // Error handled by store
    }
  };

  const handleDelete = async () => {
    if (!isAuthenticated) {
      console.warn('Delete operation requires authentication');
      return;
    }

    try {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await deleteTodo(item.id);
    } catch {
      // Error handled by store
    }
  };

  // Render delete button with fade animation based on swipe distance
  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [-100, -50, 0],
      outputRange: [1, 0.8, 0],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.deleteContainer}>
        <Animated.View style={[styles.deleteButton, { opacity }]}>
          <Text style={styles.deleteText}>Delete</Text>
        </Animated.View>
      </View>
    );
  };

  // Handle swipe completion - trigger delete and close swipeable
  const handleSwipeableOpen = (direction: 'left' | 'right') => {
    if (direction === 'left' && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    handleDelete();
    swipeableRef.current?.close();
  };

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        renderRightActions={renderRightActions}
        onSwipeableOpen={handleSwipeableOpen}
        overshootRight={true}
        rightThreshold={120}
        friction={2}
      >
        <View style={styles.container}>
          <TouchableOpacity 
            style={styles.checkboxTouchArea}
            onPress={handleToggle}
            activeOpacity={0.7}
            testID="checkbox-button"
          >
            <View style={[
              styles.checkboxInner,
              item.isCompleted && styles.checkboxChecked
            ]}>
              {item.isCompleted ? (
                <Text style={styles.checkmark}>✓</Text>
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.descriptionContainer}
            onPress={handleEdit}
            activeOpacity={0.7}
            testID="description-button"
          >
            <Text style={[
              styles.description,
              item.isCompleted && styles.descriptionCompleted
            ]}>
              {item.description}
            </Text>
          </TouchableOpacity>
        </View>
      </Swipeable>

      <EditTodoModal
        visible={isEditModalVisible}
        initialDescription={item.description}
        onSave={handleSaveEdit}
        onCancel={() => setIsEditModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkboxTouchArea: {
    padding: 8,
    marginRight: 8,
  },
  checkboxInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#CCC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: YELLOW_PRIMARY,
    borderColor: YELLOW_PRIMARY,
  },
  checkmark: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  descriptionContainer: {
    flex: 1,
    paddingVertical: 4,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  descriptionCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteContainer: {
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'flex-end',
    flex: 1,
    paddingRight: 20,
  },
  deleteButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
