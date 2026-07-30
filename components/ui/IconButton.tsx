import { memo, type ReactNode } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { AppIcon } from '@components/ui/AppIcon';
import { TOUCH_TARGET, type AppIconName } from '@constants/icons';
import { theme } from '@constants/theme';

interface IconButtonProps {
  icon?: AppIconName;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  size?: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  surface?: boolean;
  disabled?: boolean;
  haptic?: boolean;
}

/**
 * Standard 48×48 header / action icon button.
 * Uses React Native Pressable (not RNGH) — avoids conflicts with drawer gestures.
 */
function IconButtonComponent({
  icon,
  onPress,
  accessibilityLabel,
  color = theme.textPrimary,
  size,
  children,
  style,
  surface = true,
  disabled = false,
  haptic = true,
}: IconButtonProps) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={6}
      android_ripple={
        Platform.OS === 'android'
          ? { color: 'rgba(0,0,0,0.08)', borderless: true, radius: 24 }
          : undefined
      }
      onPress={() => {
        if (haptic) void Haptics.selectionAsync();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 15, stiffness: 400 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 280 });
      }}
      style={[styles.hit, style]}>
      <Animated.View
        style={[surface ? styles.surface : styles.flat, animStyle, disabled && styles.disabled]}
        pointerEvents="none">
        {children ?? (icon ? <AppIcon name={icon} color={color} size={size} /> : null)}
      </Animated.View>
    </Pressable>
  );
}

export const IconButton = memo(IconButtonComponent);

const styles = StyleSheet.create({
  hit: {
    width: TOUCH_TARGET,
    height: TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  surface: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.ultraLightGray,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },
  flat: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  disabled: {
    opacity: 0.4,
  },
});
