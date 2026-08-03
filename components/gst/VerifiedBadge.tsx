import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { theme } from '@constants/theme';

type VerifiedBadgeProps = {
  label?: string;
  variant?: 'verified' | 'enabled' | 'available' | 'pending' | 'failed';
  compact?: boolean;
  animate?: boolean;
};

const VARIANTS = {
  verified: {
    bg: `${theme.success}18`,
    color: theme.success,
    icon: 'checkmark-circle' as const,
    defaultLabel: '✔ Verified',
  },
  enabled: {
    bg: `${theme.success}18`,
    color: theme.success,
    icon: 'checkmark-circle' as const,
    defaultLabel: 'GST Invoice Enabled',
  },
  available: {
    bg: `${theme.info}15`,
    color: theme.info,
    icon: 'document-text-outline' as const,
    defaultLabel: 'Available',
  },
  pending: {
    bg: `${theme.warning}15`,
    color: theme.warning,
    icon: 'time-outline' as const,
    defaultLabel: 'Pending',
  },
  failed: {
    bg: `${theme.error}15`,
    color: theme.error,
    icon: 'close-circle' as const,
    defaultLabel: 'Failed',
  },
};

export function VerifiedBadge({
  label,
  variant = 'verified',
  compact,
  animate = true,
}: VerifiedBadgeProps) {
  const config = VARIANTS[variant];
  const scale = useSharedValue(animate ? 0.85 : 1);

  useEffect(() => {
    if (animate) {
      scale.value = withSpring(1, { damping: 12, stiffness: 220, mass: 0.8 });
    }
  }, [animate, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: compact ? 4 : 6,
          alignSelf: 'flex-start',
          backgroundColor: config.bg,
          paddingHorizontal: compact ? 8 : 10,
          paddingVertical: compact ? 3 : 5,
          borderRadius: 999,
        },
        animatedStyle,
      ]}>
      <Ionicons name={config.icon} size={compact ? 12 : 14} color={config.color} />
      <Text
        style={{
          fontSize: compact ? 10 : 11,
          fontWeight: '800',
          color: config.color,
          letterSpacing: 0.3,
        }}>
        {label ?? config.defaultLabel}
      </Text>
    </Animated.View>
  );
}
