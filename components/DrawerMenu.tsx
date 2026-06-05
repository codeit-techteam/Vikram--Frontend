import { useCallback, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import { Alert, InteractionManager, Linking, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DrawerHeader } from '@components/DrawerHeader';
import { DrawerMenuItem, DrawerSectionLabel } from '@components/DrawerMenuItem';
import { ScaledPressable } from '@components/ScaledPressable';
import { useStrings } from '@hooks/useStrings';
import { useLanguageStore } from '@store/languageStore';
import { useNotificationStore } from '@store/notificationStore';
import { resetAppStores } from '@utils/resetAppStores';

export { DRAWER_WIDTH, useDrawerAnimation, drawerPanelStyle } from '@hooks/useDrawerAnimation';
export { DrawerShell } from '@components/DrawerShell';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function LanguageToggle() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <View className="flex-row gap-1">
      {(['en', 'hi'] as const).map((lang) => {
        const active = language === lang;
        return (
          <ScaledPressable
            key={lang}
            onPress={() => setLanguage(lang)}
            className={`rounded-full px-2.5 py-1 ${
              active ? 'bg-primary' : 'border border-border bg-surface'
            }`}>
            <Text
              className={`text-[10px] font-bold ${active ? 'text-text-inverse' : 'text-text-secondary'}`}>
              {lang.toUpperCase()}
            </Text>
          </ScaledPressable>
        );
      })}
    </View>
  );
}

function AnimatedLanguageRow({
  icon,
  label,
  rightElement,
  index,
  isDrawerOpen,
}: {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  rightElement: ReactNode;
  index: number;
  isDrawerOpen: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateXItem = useSharedValue(-24);

  useEffect(() => {
    if (isDrawerOpen) {
      opacity.value = withDelay(index * 35, withTiming(1, { duration: 220 }));
      translateXItem.value = withDelay(
        index * 35,
        withSpring(0, { damping: 18, stiffness: 140 }),
      );
    } else {
      opacity.value = withTiming(0, { duration: 120 });
      translateXItem.value = withTiming(-24, { duration: 120 });
    }
  }, [isDrawerOpen, index, opacity, translateXItem]);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateXItem.value }],
  }));

  return (
    <Animated.View style={rowStyle} className="flex-row items-center px-5 py-3.5">
      <Ionicons name={icon} size={20} color="#555555" />
      <Text className="ml-4 flex-1 text-[15px] font-medium text-text">{label}</Text>
      {rightElement}
    </Animated.View>
  );
}

export function DrawerMenu({ isOpen, onClose }: DrawerMenuProps) {
  const insets = useSafeAreaInsets();
  const s = useStrings();
  const orderBadge = useNotificationStore((st) => st.orderNotifications);
  const notifBadge = useNotificationStore((st) => st.unreadCount);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const task = InteractionManager.runAfterInteractions(() => setContentReady(true));
      return () => task.cancel();
    }
    setContentReady(false);
    return undefined;
  }, [isOpen]);

  const navigateAndClose = useCallback(
    (href: Href) => {
      onClose();
      setTimeout(() => router.push(href), 150);
    },
    [onClose],
  );

  const handleLogout = () => {
    Alert.alert(s.drawerLogoutTitle, s.drawerLogoutMessage, [
      { text: s.drawerLogoutCancel, style: 'cancel' },
      {
        text: s.drawerLogoutConfirm,
        style: 'destructive',
        onPress: () => {
          onClose();
          resetAppStores();
          setTimeout(() => router.replace('/login'), 150);
        },
      },
    ]);
  };

  type IoniconName = ComponentProps<typeof Ionicons>['name'];

  const menuGroups: {
    key: string;
    section?: string;
    items: {
      icon: IoniconName;
      label: string;
      badge?: number;
      isHighlight?: boolean;
      isLanguageRow?: boolean;
      rightElement?: ReactNode;
      onPress: () => void;
    }[];
  }[] = [
    {
      key: 'main',
      items: [
        { icon: 'home-outline', label: s.drawerHome, onPress: () => navigateAndClose('/(tabs)') },
        {
          icon: 'cube-outline',
          label: s.drawerCatalog,
          onPress: () => navigateAndClose('/(tabs)/catalog'),
        },
        {
          icon: 'bag-outline',
          label: s.drawerOrders,
          badge: orderBadge,
          onPress: () => navigateAndClose('/(tabs)/orders'),
        },
        {
          icon: 'bus-outline',
          label: s.drawerTrackDeliveries,
          onPress: () => navigateAndClose('/track-delivery'),
        },
        {
          icon: 'location-outline',
          label: s.drawerSavedSites,
          onPress: () => navigateAndClose('/delivery-location'),
        },
        {
          icon: 'document-text-outline',
          label: s.drawerGstInvoices,
          onPress: () => navigateAndClose('/account/invoices'),
        },
        {
          icon: 'trophy-outline',
          label: s.drawerLoyalty,
          onPress: () => navigateAndClose('/account/loyalty'),
        },
        {
          icon: 'notifications-outline',
          label: s.drawerNotifications,
          badge: notifBadge,
          onPress: () => navigateAndClose('/notifications'),
        },
      ],
    },
    {
      key: 'procurement',
      section: s.drawerProcurementTools,
      items: [
        {
          icon: 'flash-outline',
          label: s.drawerEmergencyOrders,
          isHighlight: true,
          onPress: () => navigateAndClose('/(tabs)'),
        },
        {
          icon: 'layers-outline',
          label: s.drawerBulkProcurement,
          onPress: () => navigateAndClose('/(tabs)/catalog'),
        },
        {
          icon: 'time-outline',
          label: s.drawerOrderHistory,
          onPress: () => navigateAndClose('/orders/history'),
        },
      ],
    },
    {
      key: 'support',
      section: s.drawerSupport,
      items: [
        {
          icon: 'help-circle-outline',
          label: s.drawerHelpCenter,
          onPress: () => navigateAndClose('/support'),
        },
        {
          icon: 'chatbubble-ellipses-outline',
          label: s.drawerWhatsAppSupport,
          onPress: () => {
            onClose();
            Linking.openURL('whatsapp://send?phone=919999999999');
          },
        },
        {
          icon: 'ticket-outline',
          label: s.drawerRaiseTicket,
          onPress: () => navigateAndClose('/support'),
        },
      ],
    },
    {
      key: 'preferences',
      section: s.drawerPreferences,
      items: [
        {
          icon: 'globe-outline',
          label: s.drawerLanguage,
          isLanguageRow: true,
          rightElement: <LanguageToggle />,
          onPress: () => {},
        },
        {
          icon: 'shield-checkmark-outline',
          label: s.drawerPrivacy,
          onPress: () => navigateAndClose('/account/privacy'),
        },
        {
          icon: 'document-outline',
          label: s.drawerTerms,
          onPress: () => navigateAndClose('/(tabs)/account'),
        },
      ],
    },
  ];

  let itemIndex = 0;

  return (
    <View className="flex-1 bg-surface">
      <DrawerHeader
        isDrawerOpen={isOpen}
        onEditPress={() => navigateAndClose('/account/edit-profile')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}>
        {contentReady &&
          menuGroups.map((group) => {
            const sectionIdx = group.section ? itemIndex++ : -1;
            return (
            <View key={group.key}>
              {group.section && (
                <DrawerSectionLabel
                  label={group.section}
                  index={sectionIdx}
                  isDrawerOpen={isOpen}
                />
              )}
              {group.items.map((item) => {
                const idx = itemIndex++;
                return item.isLanguageRow ? (
                  <AnimatedLanguageRow
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    rightElement={item.rightElement}
                    index={idx}
                    isDrawerOpen={isOpen}
                  />
                ) : (
                  <DrawerMenuItem
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    badge={item.badge}
                    isHighlight={item.isHighlight}
                    rightElement={item.rightElement}
                    index={idx}
                    isDrawerOpen={isOpen}
                    onPress={item.onPress}
                  />
                );
              })}
            </View>
            );
          })}

        {contentReady && (
          <>
            <View className="mx-5 my-2 h-px bg-border" />

            <DrawerMenuItem
              icon="log-out-outline"
              label={s.drawerLogout}
              isDestructive
              index={itemIndex}
              isDrawerOpen={isOpen}
              onPress={handleLogout}
            />

            <Text className="mt-4 text-center text-xs text-text-secondary">{s.drawerVersion}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
