import { type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScaledPressableProps extends PressableProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
}

export function ScaledPressable({
  children,
  style,
  scaleTo = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  android_ripple,
  ...props
}: ScaledPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      android_ripple={
        android_ripple ??
        (Platform.OS === 'android'
          ? { color: 'rgba(0,0,0,0.08)', borderless: false }
          : undefined)
      }
      style={[animatedStyle, style]}
      onPressIn={(e) => {
        if (!disabled) scale.value = withSpring(scaleTo, { damping: 15, stiffness: 300 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        onPressOut?.(e);
      }}>
      {children}
    </AnimatedPressable>
  );
}
