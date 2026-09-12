import { useEffect } from 'react';
import { Alert, BackHandler, Platform, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountTabIcon } from '@components/account/AccountTabIcon';
import { BottomTabIcon, TAB_BAR_THEME, TabIcons } from '@components/BottomNavigation';
import { layout } from '@constants/spacing';
import { typography } from '@constants/typography';
import { usePaymentRecovery } from '@hooks/usePaymentRecovery';
import { useIsAtTabRoot } from '@hooks/useSafeIsFocused';
import { useTranslation } from '@store/languageStore';
import { useOrderStore } from '@store/orderStore';

/**
 * Android back-to-exit on tab roots only.
 * Uses NavigationContainerRef (never usePathname) so Stack screens like /checkout
 * still receive a normal back press.
 */
function useAndroidTabExitHandler() {
  const atTabRoot = useIsAtTabRoot();

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backAction = () => {
      if (!atTabRoot) return false;
      Alert.alert('Exit Bajriwala?', 'Are you sure you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => sub.remove();
  }, [atTabRoot]);
}

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarBottomInset = Math.max(insets.bottom, 10);
  const activeOrders = useOrderStore(
    (st) => st.orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,
  );

  useAndroidTabExitHandler();
  usePaymentRecovery();

  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: false,
        animation: 'fade',
        tabBarActiveTintColor: TAB_BAR_THEME.active,
        tabBarInactiveTintColor: TAB_BAR_THEME.inactive,
        tabBarStyle: {
          backgroundColor: TAB_BAR_THEME.background,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: TAB_BAR_THEME.border,
          height: layout.tabBarContent + tabBarBottomInset,
          paddingBottom: tabBarBottomInset,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          ...typography.tabLabel,
          marginTop: 2,
        },
        tabBarBadgeStyle: {
          backgroundColor: TAB_BAR_THEME.active,
          fontSize: 9,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ color }) => (
            <BottomTabIcon name={TabIcons.home} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('tabCatalog'),
          tabBarIcon: ({ color }) => (
            <BottomTabIcon name={TabIcons.catalog} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: t('tabOrders'),
          tabBarBadge: activeOrders > 0 ? activeOrders : undefined,
          tabBarIcon: ({ color }) => (
            <BottomTabIcon name={TabIcons.orders} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('tabAccount'),
          tabBarIcon: ({ color, focused }) => (
            <AccountTabIcon focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
