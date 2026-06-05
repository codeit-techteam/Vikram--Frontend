import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  type AnimatedStyle,
} from 'react-native-reanimated';

import { LogoIcon } from '@components/BrandLogo';
import { useCartStore } from '@store/cartStore';
import { useNotificationStore } from '@store/notificationStore';
import { safeGoBack } from '@utils/navigation';

interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
  showCart?: boolean;
  showBell?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  isDrawerOpen?: boolean;
  menuIconStyle?: AnimatedStyle<ViewStyle>;
}

export function AppHeader({
  showBack = false,
  title,
  showCart = true,
  showBell = true,
  onBackPress,
  onMenuPress,
  isDrawerOpen = false,
  menuIconStyle,
}: AppHeaderProps) {
  const cartCount = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));
  const cartBumpVersion = useCartStore((s) => s.cartBumpVersion);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const cartScale = useSharedValue(1);

  useEffect(() => {
    if (cartBumpVersion === 0) return;
    cartScale.value = withSequence(
      withSpring(1.35, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
  }, [cartBumpVersion, cartScale]);

  const cartIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else safeGoBack();
  };

  const leftIcon = showBack ? 'arrow-back' : isDrawerOpen ? 'close' : 'menu';

  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          onPress={handleBack}
          style={styles.hamburger}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#1A1A1A" />
        </Pressable>
      ) : (
        <Pressable
          onPress={onMenuPress}
          style={styles.hamburger}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Animated.View style={menuIconStyle}>
            <Ionicons name={leftIcon} size={24} color="#1A1A1A" />
          </Animated.View>
        </Pressable>
      )}

      <View style={styles.logoContainer}>
        {title ? (
          <Text style={styles.titleText} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <>
            <LogoIcon size={28} />
            <Text style={styles.logoText}>BuildQuick India</Text>
          </>
        )}
      </View>

      <View style={styles.rightIcons}>
        {showBell && (
          <Pressable
            onPress={() => router.push('/notifications')}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
            <Ionicons name="notifications-outline" size={22} color="#1A1A1A" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        )}

        {showCart && (
          <Pressable
            onPress={() => router.push('/cart')}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}>
            <Animated.View style={cartIconStyle}>
              <Ionicons name="cart-outline" size={22} color="#1A1A1A" />
            </Animated.View>
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount > 9 ? '9+' : cartCount}</Text>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  hamburger: {
    padding: 4,
    marginRight: 8,
  },
  logoContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A73E8',
    letterSpacing: -0.3,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconBtn: {
    padding: 6,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF6B00',
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
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
});
