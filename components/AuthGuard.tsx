import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/authStore';

const YELLOW_PRIMARY = '#FFD700';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Redirect based on auth state: unauthenticated -> login, authenticated -> TODO list
  useEffect(() => {
    const inAuthGroup = segments[0] === '(tabs)';

    if (!isLoading) {
      if (!isAuthenticated && inAuthGroup) {
        router.replace('/login' as any);
      } else if (isAuthenticated && !inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={YELLOW_PRIMARY} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
  },
});
