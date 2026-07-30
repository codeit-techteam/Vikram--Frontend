import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIcon } from '@components/ui/AppIcon';
import { IconButton } from '@components/ui/IconButton';
import { CountBadge } from '@components/ui/CountBadge';
import { ICON_SIZE } from '@constants/icons';
import { theme } from '@constants/theme';
import { useCartStore } from '@store/cartStore';
import { useNotificationStore } from '@store/notificationStore';
import { router } from 'expo-router';
import { useEffect } from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

interface HeaderIconProps {
  color?: string;
  size?: number;
}

/** @deprecated Prefer AppHeader action cluster. Kept for legacy screens. */
export function NotificationBell({
  color = theme.textPrimary,
  size = ICON_SIZE.header,
}: HeaderIconProps) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <IconButton
      accessibilityLabel="Notifications"
      onPress={() => router.push('/notifications')}
      surface={false}>
      <AppIcon name="notification" size={size} color={color} />
      <CountBadge count={unreadCount} />
    </IconButton>
  );
}

/** @deprecated Prefer AppHeader action cluster. Kept for legacy screens. */
export function CartIcon({
  color = theme.textPrimary,
  size = ICON_SIZE.header,
}: HeaderIconProps) {
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const cartBumpVersion = useCartStore((s) => s.cartBumpVersion);
  const cartScale = useSharedValue(1);

  useEffect(() => {
    if (cartBumpVersion === 0) return;
    cartScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 280 }),
      withSpring(1, { damping: 12 }),
    );
  }, [cartBumpVersion, cartScale]);

  const cartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  return (
    <IconButton
      accessibilityLabel="Cart"
      onPress={() => router.push('/cart')}
      surface={false}>
      <Animated.View style={cartAnimStyle}>
        <AppIcon name="cart" size={size} color={color} />
        <CountBadge count={cartCount} />
      </Animated.View>
    </IconButton>
  );
}

/** Convenience row of standard header actions. */
export function HeaderActionCluster() {
  return (
    <View style={styles.row}>
      <NotificationBell />
      <CartIcon />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export const NotificationBadge = CountBadge;
export const CartBadge = CountBadge;
