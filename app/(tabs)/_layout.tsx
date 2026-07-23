import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountTabIcon } from '@components/account/AccountTabIcon';
import { useTranslation } from '@store/languageStore';
import { useOrderStore } from '@store/orderStore';

const TAB_BAR_CONTENT_HEIGHT = 52;

export default function TabLayout() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const tabBarBottomInset = Math.max(insets.bottom, 10);
  const activeOrders = useOrderStore(
    (st) => st.orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        tabBarActiveTintColor: '#FEB623',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: '#E5E5E5',
          height: TAB_BAR_CONTENT_HEIGHT + tabBarBottomInset,
          paddingBottom: tabBarBottomInset,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarBadgeStyle: {
          backgroundColor: '#FEB623',
          fontSize: 9,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabHome'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: t('tabCatalog'),
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cube' : 'cube-outline'} size={22} color={color} />
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
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'car' : 'car-outline'} size={22} color={color} />
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
