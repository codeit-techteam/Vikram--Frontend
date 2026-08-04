import { memo, useEffect, useRef } from 'react';
import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { theme } from '@constants/theme';
import { ICON_SIZE } from '@constants/icons';

interface CountBadgeProps {
  count: number;
  style?: StyleProp<ViewStyle>;
  max?: number;
  /** Extra bounce when count changes (cart badge). */
  animate?: boolean;
}

/** Shared 16dp notification / cart count badge. */
function CountBadgeComponent({
  count,
  style,
  max = 9,
  animate = true,
}: CountBadgeProps) {
  const scale = useSharedValue(1);
  const prevCount = useRef(count);

  useEffect(() => {
    if (!animate) {
      prevCount.current = count;
      return;
    }
    if (count <= 0) {
      prevCount.current = count;
      return;
    }
    if (prevCount.current === count) return;
    const growing = count > prevCount.current;
    prevCount.current = count;
    scale.value = withSequence(
      withSpring(growing ? 1.35 : 1.15, {
        damping: 8,
        stiffness: 320,
        overshootClamping: false,
      }),
      withSpring(1, { damping: 14, stiffness: 260, overshootClamping: true }),
    );
  }, [animate, count, scale]);

  useEffect(() => {
    if (count > 0) {
      scale.value = withTiming(1, { duration: 0 });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount only

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);

  return (
    <Animated.View style={[styles.badge, style, animStyle]} pointerEvents="none">
      <Text style={styles.text}>{label}</Text>
    </Animated.View>
  );
}

export const CountBadge = memo(CountBadgeComponent);
export const NotificationBadge = CountBadge;
export const CartBadge = CountBadge;

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: theme.primary,
    borderRadius: ICON_SIZE.badge / 2 + 1,
    minWidth: ICON_SIZE.badge,
    height: ICON_SIZE.badge,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: theme.white,
    zIndex: 2,
  },
  text: {
    color: theme.textOnPrimary,
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 11,
  },
});
