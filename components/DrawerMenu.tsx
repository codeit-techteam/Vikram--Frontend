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
import { useTranslation } from '@store/languageStore';
import { useNotificationStore } from '@store/notificationStore';
import { requireAuth } from '@utils/requireAuth';
import { resetAppStores } from '@utils/resetAppStores';

export { DRAWER_WIDTH, useDrawerAnimation, drawerPanelStyle } from '@hooks/useDrawerAnimation';
export { DrawerShell } from '@components/DrawerShell';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function LanguageToggle() {
  const { language, setLanguage } = useTranslation();

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
              className={`text-[10px] font-bold ${active ? 'text-onPrimary' : 'text-text-secondary'}`}>
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
  const { t } = useTranslation();
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
    (href: Href, authRequired = false) => {
      if (authRequired && !requireAuth()) return;
      onClose();
      setTimeout(() => router.push(href), 150);
    },
    [onClose],
  );

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: () => {
          onClose();
          setTimeout(() => {
            void resetAppStores().then(() => router.replace('/(tabs)'));
          }, 150);
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
        { icon: 'home-outline', label: t('drawerHome'), onPress: () => navigateAndClose('/(tabs)') },
        {
          icon: 'cube-outline',
          label: t('drawerCatalog'),
          onPress: () => navigateAndClose('/(tabs)/catalog'),
        },
        {
          icon: 'bag-outline',
          label: t('drawerOrders'),
          badge: orderBadge,
          onPress: () => navigateAndClose('/(tabs)/orders', true),
        },
        {
          icon: 'bus-outline',
          label: t('drawerTrackDeliveries'),
          onPress: () => navigateAndClose('/track-delivery', true),
        },
        {
          icon: 'location-outline',
          label: t('drawerSavedSites'),
          onPress: () => navigateAndClose('/delivery-location', true),
        },
        {
          icon: 'document-text-outline',
          label: t('invoices'),
          onPress: () => navigateAndClose('/account/invoices', true),
        },
        {
          icon: 'receipt-outline',
          label: t('businessDetailsMenu'),
          onPress: () => navigateAndClose('/account/business-details' as Href, true),
        },
        {
          icon: 'trophy-outline',
          label: t('loyaltyWallet'),
          onPress: () => navigateAndClose('/account/loyalty', true),
        },
        {
          icon: 'notifications-outline',
          label: t('drawerNotifications'),
          badge: notifBadge,
          onPress: () => navigateAndClose('/notifications'),
        },
      ],
    },
    {
      key: 'procurement',
      section: t('drawerProcurementTools'),
      items: [
        {
          icon: 'flash-outline',
          label: t('drawerEmergencyOrders'),
          isHighlight: true,
          onPress: () => navigateAndClose('/(tabs)'),
        },
        {
          icon: 'layers-outline',
          label: t('drawerBulkProcurement'),
          onPress: () => navigateAndClose('/(tabs)/catalog'),
        },
        {
          icon: 'time-outline',
          label: t('orderHistoryMenu'),
          onPress: () => navigateAndClose('/orders/history', true),
        },
      ],
    },
    {
      key: 'support',
      section: t('drawerSupport'),
      items: [
        {
          icon: 'help-circle-outline',
          label: t('drawerHelpCenter'),
          onPress: () => navigateAndClose('/support'),
        },
        {
          icon: 'chatbubble-ellipses-outline',
          label: t('drawerWhatsAppSupport'),
          onPress: () => {
            onClose();
            Linking.openURL('whatsapp://send?phone=919999999999');
          },
        },
        {
          icon: 'ticket-outline',
          label: t('drawerRaiseTicket'),
          onPress: () => navigateAndClose('/support'),
        },
      ],
    },
    {
      key: 'preferences',
      section: t('drawerPreferences'),
      items: [
        {
          icon: 'globe-outline',
          label: t('drawerLanguage'),
          isLanguageRow: true,
          rightElement: <LanguageToggle />,
          onPress: () => {},
        },
        {
          icon: 'reader-outline',
          label: t('drawerTerms'),
          onPress: () => navigateAndClose('/account/terms' as Href),
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
              label={t('logout')}
              isDestructive
              index={itemIndex}
              isDrawerOpen={isOpen}
              onPress={handleLogout}
            />

            <Text className="mt-4 text-center text-xs text-text-secondary">{t('drawerVersion')}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
