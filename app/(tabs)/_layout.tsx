import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountTabIcon } from '@components/account/AccountTabIcon';
import { useStrings } from '@hooks/useStrings';
import { useOrderStore } from '@store/orderStore';

const TAB_BAR_CONTENT_HEIGHT = 52;

export default function TabLayout() {
  const s = useStrings();
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
        tabBarActiveTintColor: '#FF6B00',
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
          backgroundColor: '#FF6B00',
          fontSize: 9,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: s.tabHome,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: s.tabCatalog,
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
          title: s.tabOrders,
          tabBarBadge: activeOrders > 0 ? activeOrders : undefined,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'car' : 'car-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: s.tabAccount,
          tabBarIcon: ({ color, focused }) => (
            <AccountTabIcon focused={focused} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
