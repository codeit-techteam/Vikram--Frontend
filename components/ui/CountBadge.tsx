import { memo } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { theme } from '@constants/theme';
import { ICON_SIZE } from '@constants/icons';

interface CountBadgeProps {
  count: number;
  style?: StyleProp<ViewStyle>;
  max?: number;
}

/** Shared 16dp notification / cart count badge. */
function CountBadgeComponent({ count, style, max = 9 }: CountBadgeProps) {
  if (count <= 0) return null;
  const label = count > max ? `${max}+` : String(count);

  return (
    <View style={[styles.badge, style]} pointerEvents="none">
      <Text style={styles.text}>{label}</Text>
    </View>
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
