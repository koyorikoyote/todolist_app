import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

const YELLOW_PRIMARY = '#FFD700';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, isAuthenticated, failedAttempts, shouldTimeout, resetFailedAttempts, lastAuthTime } = useAuthStore();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [timeoutRemaining, setTimeoutRemaining] = useState<number>(0);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, router]);

  // Update timeout countdown every second
  useEffect(() => {
    if (shouldTimeout() && lastAuthTime !== null) {
      const updateTimer = () => {
        const elapsed = Date.now() - lastAuthTime;
        const remaining = Math.ceil((30000 - elapsed) / 1000);

        if (remaining <= 0) {
          setTimeoutRemaining(0);
          resetFailedAttempts();
          return false;
        } else {
          setTimeoutRemaining(remaining);
          return true;
        }
      };

      updateTimer();
      const interval = setInterval(() => {
        if (!updateTimer()) {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setTimeoutRemaining(0);
    }
  }, [failedAttempts, shouldTimeout, resetFailedAttempts, lastAuthTime]);

  const handleAuthenticate = async () => {
    if (shouldTimeout()) {
      setErrorMessage(`Too many failed attempts. Please wait ${timeoutRemaining} seconds.`);
      return;
    }

    setErrorMessage('');
    const success = await login();

    if (!success) {
      if (failedAttempts >= 2) {
        setErrorMessage('Too many failed attempts. Please wait 30 seconds before trying again.');
      } else {
        setErrorMessage('Authentication failed. Please try again.');
      }
    }
  };

  const isDisabled = isLoading || shouldTimeout();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        <Text style={styles.title}>Secure TODO App</Text>
        <Text style={styles.subtitle}>
          Authenticate to access your secure TODO list
        </Text>

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, isDisabled && styles.buttonDisabled]}
          onPress={handleAuthenticate}
          disabled={isDisabled}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#000" size="small" />
          ) : (
            <Text style={styles.buttonText}>
              {shouldTimeout() ? `Wait ${timeoutRemaining}s` : 'Authenticate'}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={styles.infoText}>
          {Platform.OS === 'web'
            ? 'Use your device PIN or passcode to authenticate'
            : 'Use Face ID, Touch ID, or your device passcode'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9E6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: YELLOW_PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: YELLOW_PRIMARY,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#888',
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
