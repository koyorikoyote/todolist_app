import React, { memo } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import TodoItem from './TodoItem';
import { TodoItem as TodoItemType } from '../types';

interface TodoListProps {
  todos: TodoItemType[];
}

const TodoList = memo(({ todos }: TodoListProps) => {
  const keyExtractor = (item: TodoItemType) => item.id;

  const renderItem = ({ item }: { item: TodoItemType }) => (
    <TodoItem item={item} />
  );

  if (todos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No TODO items yet</Text>
        <Text style={styles.emptySubtext}>Add your first task to get started</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={todos}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.list}
      contentContainerStyle={styles.contentContainer}
    />
  );
});

TodoList.displayName = 'TodoList';

export default TodoList;

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#BBB',
    textAlign: 'center',
  },
});
