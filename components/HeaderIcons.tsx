import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

  return (
    <Pressable
      onPress={() => router.push('/cart')}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
      <View>
        <Ionicons name="cart-outline" size={size} color={color} />
        {cartCount > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
          </View>
        ) : null}
      </View>
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
