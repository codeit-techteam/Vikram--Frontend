import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ToastProps {
  message: string;
  visible: boolean;
}

export function Toast({ message, visible }: ToastProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(-20, { damping: 14, stiffness: 150 });
      opacity.value = withTiming(1, { duration: 200 });
      const timer = setTimeout(() => {
        translateY.value = withTiming(100, { duration: 250 });
        opacity.value = withTiming(0, { duration: 250 });
      }, 2000);
      return () => clearTimeout(timer);
    }
    translateY.value = withTiming(100, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 });
  }, [visible, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toast, animStyle]} pointerEvents="none">
      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
