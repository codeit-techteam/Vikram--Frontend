import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReorderFeedbackStore } from '@store/reorderFeedbackStore';

const AUTO_DISMISS_MS = 2500;

export function ReorderToast() {
  const insets = useSafeAreaInsets();
  const message = useReorderFeedbackStore((s) => s.toastMessage);
  const clearToast = useReorderFeedbackStore((s) => s.clearToast);
  const translateY = useSharedValue(120);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!message) {
      translateY.value = withTiming(120, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 });
      return;
    }

    translateY.value = withSpring(-(insets.bottom + 16), { damping: 16, stiffness: 180 });
    opacity.value = withTiming(1, { duration: 200 });

    const timer = setTimeout(clearToast, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [message, clearToast, insets.bottom, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!message) return null;

  return (
    <Animated.View style={[styles.toast, animStyle]} pointerEvents="none">
      <Ionicons name="checkmark-circle" size={18} color="#34C759" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 0,
    alignSelf: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '90%',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
});
