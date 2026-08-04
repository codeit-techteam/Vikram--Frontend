import { memo, useEffect, type ReactNode } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  type AnimatedStyle,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIcon } from '@components/ui/AppIcon';
import { IconButton } from '@components/ui/IconButton';
import { CountBadge } from '@components/ui/CountBadge';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import { ICON_SIZE } from '@constants/icons';
import { layout } from '@constants/spacing';
import { typography } from '@constants/typography';
import { Logo, theme } from '@constants/theme';
import { useCartStore } from '@store/cartStore';
import { useNotificationStore } from '@store/notificationStore';
import { safeGoBack } from '@utils/navigation';

export interface AppHeaderProps {
  showBack?: boolean;
  title?: string;
  showLogo?: boolean;
  showCart?: boolean;
  showBell?: boolean;
  showVoice?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  isDrawerOpen?: boolean;
  menuIconStyle?: AnimatedStyle<ViewStyle>;
  /** Apply safe-area top inset (default true). */
  safeTop?: boolean;
  /** Address / search / extra rows inside the elevated header shell. */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Canonical app header for every main screen.
 * Layout: ☰ · Logo · Bajriwala  |  Mic · Bell · Cart
 */
function AppHeaderComponent({
  showBack = false,
  title,
  showLogo = true,
  showCart = true,
  showBell = true,
  showVoice = true,
  onBackPress,
  onMenuPress,
  isDrawerOpen = false,
  menuIconStyle,
  safeTop = true,
  footer,
  style,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const cartCount = useCartStore((s) =>
    s.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const cartBumpVersion = useCartStore((s) => s.cartBumpVersion);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const cartScale = useSharedValue(1);

  useEffect(() => {
    if (cartBumpVersion === 0) return;
    cartScale.value = withSequence(
      withSpring(1.35, { damping: 6, stiffness: 340 }),
      withSpring(0.92, { damping: 10, stiffness: 280 }),
      withSpring(1, { damping: 12, stiffness: 240, overshootClamping: true }),
    );
  }, [cartBumpVersion, cartScale]);

  const cartIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  const handleBack = () => {
    if (onBackPress) onBackPress();
    else safeGoBack();
  };

  const menuName = isDrawerOpen ? 'close' : 'menu';

  return (
    <View
      collapsable={false}
      style={[
        styles.shell,
        {
          paddingTop: safeTop ? Math.max(insets.top, 8) : 8,
          ...(Platform.OS === 'android' ? { elevation: 6 } : null),
        },
        style,
      ]}>
      <View style={styles.toolbar}>
        <View style={styles.left}>
          {showBack ? (
            <IconButton icon="back" accessibilityLabel="Go back" onPress={handleBack} />
          ) : (
            <IconButton
              accessibilityLabel={isDrawerOpen ? 'Close menu' : 'Open menu'}
              onPress={() => onMenuPress?.()}>
              <Animated.View style={menuIconStyle ?? undefined}>
                <AppIcon name={menuName} size={ICON_SIZE.header} color={theme.textPrimary} />
              </Animated.View>
            </IconButton>
          )}

          <View style={styles.brand} pointerEvents="none">
            {title ? (
              <Text style={styles.titleText} numberOfLines={1}>
                {title}
              </Text>
            ) : showLogo ? (
              <>
                <Image source={Logo} style={styles.logoImage} resizeMode="contain" />
                <Text style={styles.logoText} numberOfLines={1}>
                  {theme.appName}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        <View style={styles.right}>
          {showVoice ? (
            <IconButton
              icon="voice"
              color={theme.primary}
              accessibilityLabel="Voice search"
              onPress={openVoiceAssistant}
            />
          ) : null}

          {showBell ? (
            <IconButton
              accessibilityLabel="Notifications"
              onPress={() => router.push('/notifications')}>
              <AppIcon
                name="notification"
                size={ICON_SIZE.header}
                color={theme.textPrimary}
              />
              <CountBadge count={unreadCount} />
            </IconButton>
          ) : null}

          {showCart ? (
            <IconButton
              accessibilityLabel="Cart"
              onPress={() => router.push('/cart')}>
              <Animated.View style={cartIconStyle}>
                <AppIcon name="cart" size={ICON_SIZE.header} color={theme.textPrimary} />
              </Animated.View>
              <CountBadge count={cartCount} />
            </IconButton>
          ) : null}
        </View>
      </View>

      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

export const AppHeader = memo(AppHeaderComponent);

const styles = StyleSheet.create({
  shell: {
    backgroundColor: theme.white,
    paddingHorizontal: 10,
    paddingBottom: 10,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ECECEC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    zIndex: 100,
    elevation: Platform.OS === 'android' ? 8 : undefined,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: layout.headerIconHit,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 2,
  },
  brand: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
    marginLeft: 2,
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  logoText: {
    ...typography.headerBrand,
    color: theme.textPrimary,
  },
  titleText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textPrimary,
    letterSpacing: -0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  footer: {
    marginTop: 4,
    gap: 8,
  },
});
