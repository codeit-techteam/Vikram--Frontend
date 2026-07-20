import { Alert } from 'react-native';
import { router } from 'expo-router';

import { useAuthStore } from '@store/useAuthStore';

/**
 * If the user is in guest mode, prompt them to log in.
 * Returns true when the action may proceed (not a guest).
 */
export function requireAuth(message = 'Please log in to continue.'): boolean {
  const isGuest = useAuthStore.getState().isGuest;
  if (!isGuest) return true;

  Alert.alert('Login required', message, [
    { text: 'Cancel', style: 'cancel' },
    {
      text: 'Login',
      onPress: () => router.replace('/login'),
    },
  ]);
  return false;
}
