import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import type BottomSheet from '@gorhom/bottom-sheet';

import { DrawerShell } from '@components/DrawerShell';
import { OrderCard } from '@components/orders/OrderCard';
import {
  OrderFilterSheet,
  type OrderFilters,
} from '@components/orders/OrderFilterSheet';
import { AppHeader } from '@components/AppHeader';
import { ScaledPressable } from '@components/ScaledPressable';
import { useOrderStore } from '@store/orderStore';
import { filterOrders } from '@utils/filterOrders';

export default function OrdersScreen() {
  const orders = useOrderStore((s) => s.orders);
  const proTipDismissed = useOrderStore((s) => s.proTipDismissed);
  const dismissProTip = useOrderStore((s) => s.dismissProTip);
  const refreshOrders = useOrderStore((s) => s.refreshOrders);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'recent' | 'filter' | 'sort'>('recent');
  const [filters, setFilters] = useState<OrderFilters>({ status: 'all', date: 'all' });

  const filterSheetRef = useRef<BottomSheet>(null);

  const filtered = useMemo(
    () => filterOrders(orders, search, filters),
    [orders, search, filters],
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshOrders();
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, [refreshOrders]);

  const openFilter = () => {
    setActiveFilter('filter');
    filterSheetRef.current?.expand();
  };

  return (
    <DrawerShell
      isOpen={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}>
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />

      <View className="mx-5 flex-row items-center rounded-input border border-border bg-surface px-4 py-3">
        <Ionicons name="search" size={20} color="#FF6B00" />
        <Text className="ml-3 flex-1 text-sm text-text-secondary">
          Search premium construction materials...
        </Text>
        <Ionicons name="mic-outline" size={20} color="#FF6B00" />
      </View>

      <View className="mx-5 mt-4 flex-row gap-2">
        <ScaledPressable
          onPress={openFilter}
          className={`flex-row items-center rounded-full px-4 py-2 ${
            activeFilter === 'filter' ? 'border-2 border-primary' : 'border border-border'
          }`}>
          <Ionicons name="options-outline" size={14} color="#666" />
          <Text className="ml-1 text-sm font-semibold text-text-secondary">Filter</Text>
        </ScaledPressable>
        <ScaledPressable
          onPress={() => setActiveFilter('sort')}
          className="flex-row items-center rounded-full border border-border px-4 py-2">
          <Ionicons name="swap-vertical" size={14} color="#666" />
          <Text className="ml-1 text-sm font-semibold text-text-secondary">Sort</Text>
        </ScaledPressable>
        <ScaledPressable
          onPress={() => {
            setActiveFilter('recent');
            setFilters({ status: 'all', date: 'all' });
          }}
          className={`rounded-full px-4 py-2 ${
            activeFilter === 'recent' ? 'bg-primary' : 'border border-border'
          }`}>
          <Text
            className={`text-sm font-semibold ${
              activeFilter === 'recent' ? 'text-text-inverse' : 'text-text-secondary'
            }`}>
            Recent Orders
          </Text>
        </ScaledPressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6B00" />}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInUp.delay(index * 80).duration(400)}>
            <OrderCard order={item} />
          </Animated.View>
        )}
        ListFooterComponent={
          !proTipDismissed ? (
            <View className="relative overflow-hidden rounded-card bg-primary p-5">
              <ScaledPressable
                onPress={dismissProTip}
                className="absolute right-3 top-3 z-10 h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </ScaledPressable>
              <View className="self-start rounded-full bg-white/20 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-text-inverse">Pro Tip</Text>
              </View>
              <Text className="mt-2 text-lg font-bold text-text-inverse">Optimize Delivery</Text>
              <Text className="mt-2 text-sm leading-5 text-text-inverse/90">
                Combine Cement and TMT orders to unlock free specialized logistics handling for
                your site.
              </Text>
              <Text className="mt-3 text-xs text-text-inverse/80">
                ⏰ Next available slot: Today, 4:00 PM
              </Text>
              <Ionicons
                name="bus-outline"
                size={80}
                color="rgba(255,255,255,0.15)"
                style={{ position: 'absolute', right: 8, bottom: 8 }}
              />
            </View>
          ) : null
        }
      />

      <OrderFilterSheet
        ref={filterSheetRef}
        filters={filters}
        onApply={(f) => {
          setFilters(f);
          setActiveFilter('filter');
          filterSheetRef.current?.close();
        }}
      />
    </SafeAreaView>
    </DrawerShell>
  );
}
