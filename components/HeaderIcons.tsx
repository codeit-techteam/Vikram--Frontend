import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { useCartStore } from '@store/cartStore';
import { useNotificationStore } from '@store/notificationStore';

interface HeaderIconProps {
  color?: string;
  size?: number;
}

export function NotificationBell({ color = '#1A1A1A', size = 20 }: HeaderIconProps) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Pressable
      onPress={() => router.push('/notifications')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <View>
        <Ionicons name="notifications-outline" size={size} color={color} />
        {unreadCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function CartIcon({ color = '#1A1A1A', size = 20 }: HeaderIconProps) {
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const cartBumpVersion = useCartStore((s) => s.cartBumpVersion);
  const cartScale = useSharedValue(1);
  const badgeScale = useSharedValue(1);

  useEffect(() => {
    if (cartBumpVersion === 0) return;
    cartScale.value = withSequence(
      withSpring(1.2, { damping: 8, stiffness: 280 }),
      withSpring(1, { damping: 12 }),
    );
    badgeScale.value = withSequence(
      withSpring(1.45, { damping: 6, stiffness: 320 }),
      withSpring(1, { damping: 10 }),
    );
  }, [cartBumpVersion, cartScale, badgeScale]);

  const cartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  return (
    <Pressable
      onPress={() => router.push('/cart')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <Animated.View style={cartAnimStyle}>
        <Ionicons name="cart-outline" size={size} color={color} />
        {cartCount > 0 ? (
          <Animated.View style={[styles.badge, badgeAnimStyle]}>
            <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
          </Animated.View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: '#FEB623',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#1A1A1A',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
});
