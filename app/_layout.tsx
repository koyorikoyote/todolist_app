import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import AuthGuard from '@/components/AuthGuard';
import ErrorBoundary from '@/components/ErrorBoundary';

const YELLOW_PRIMARY = '#FFD700';
const YELLOW_BACKGROUND = '#FFF9E6';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <ErrorBoundary>
        <AuthGuard>
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: YELLOW_PRIMARY,
              },
              headerTintColor: '#000',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              contentStyle: styles.content,
            }}
          >
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
          <StatusBar style="dark" />
        </AuthGuard>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  content: {
    backgroundColor: YELLOW_BACKGROUND,
  },
});
