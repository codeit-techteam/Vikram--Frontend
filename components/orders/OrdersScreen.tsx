import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, Layout } from 'react-native-reanimated';
import { useSafeIsFocused } from '@hooks/useSafeIsFocused';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@components/AppHeader';
import { AppIcon } from '@components/ui/AppIcon';
import { IconButton } from '@components/ui/IconButton';
import { DrawerShell } from '@components/DrawerShell';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { EmptyOrdersState } from '@components/orders/EmptyOrdersState';
import { GuestOrdersState } from '@components/orders/GuestOrdersState';
import { OrderCard } from '@components/orders/OrderCard';
import { OrderCardSkeleton, OrdersListSkeleton } from '@components/orders/OrderSkeleton';
import { ScaledPressable } from '@components/ScaledPressable';
import { ORDER_FILTERS } from '@constants/orderStatus';
import { ICON_SIZE } from '@constants/icons';
import { useOrders } from '@hooks/useOrders';
import { useReorder } from '@hooks/useReorder';
import { realtimeSocket } from '@services/realtime.socket';
import { useAuthStore } from '@store/useAuthStore';
import type { Order, OrderFilterStatus } from '@/types/order';
import { theme } from '@constants/theme';
import { requireAuth } from '@utils/requireAuth';

const AnimatedPressable = Animated.createAnimatedComponent(ScaledPressable);

function FilterChips({
  activeFilter,
  onChange,
}: {
  activeFilter: OrderFilterStatus;
  onChange: (filter: OrderFilterStatus) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        flexGrow: 0,
        backgroundColor: theme.white,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
      }}
      contentContainerStyle={{
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 8,
        flexDirection: 'row',
      }}>
      {ORDER_FILTERS.map((filter) => {
        const isActive = activeFilter === filter.id;
        return (
          <AnimatedPressable
            key={filter.id}
            layout={Layout.springify()}
            onPress={() => {
              onChange(filter.id);
              Haptics.selectionAsync();
            }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: isActive ? theme.primary : theme.ultraLightGray,
              borderWidth: 1,
              borderColor: isActive ? theme.primary : theme.border,
            }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: isActive ? theme.textPrimary : theme.textSecondary,
              }}>
              {filter.label}
            </Text>
          </AnimatedPressable>
        );
      })}
    </ScrollView>
  );
}

export const OrdersScreen = memo(function OrdersScreen() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OrderFilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn && !s.isGuest);
  const isFocused = useSafeIsFocused();
  const lastFocusRefreshAt = useRef(0);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(handle);
  }, [searchQuery]);

  const {
    orders,
    isLoading,
    isRefreshing,
    isFetchingNextPage,
    hasNextPage,
    error,
    refresh,
    loadMore,
    cancelOrder,
    isCancelling,
    prefetchOrder,
  } = useOrders(activeFilter, debouncedSearch);

  useEffect(() => {
    if (!isFocused || !isLoggedIn) return;
    // Catch updates missed while another tab was open / socket briefly down.
    // Throttle so unstable effect deps cannot spam GET /orders.
    if (realtimeSocket.isConnected()) return;
    const now = Date.now();
    if (now - lastFocusRefreshAt.current < 15_000) return;
    lastFocusRefreshAt.current = now;
    void refresh();
  }, [isFocused, isLoggedIn, refresh]);

  const { reorder, isReordering, reorderingOrderId } = useReorder();

  const handleReorder = useCallback(
    async (orderId: string) => {
      if (!requireAuth('Please log in to reorder.')) return;
      await reorder(orderId);
    },
    [reorder],
  );

  const handleCancel = useCallback(
    async (orderId: string) => {
      await cancelOrder({ orderId, reason: 'Cancelled by customer' });
    },
    [cancelOrder],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: Order; index: number }) => (
      <OrderCard
        order={item}
        index={index}
        onPress={() => prefetchOrder(item.id)}
        onReorder={handleReorder}
        onCancel={handleCancel}
        isCancelling={isCancelling}
        isReordering={isReordering && reorderingOrderId === item.id}
      />
    ),
    [prefetchOrder, handleReorder, handleCancel, isCancelling, isReordering, reorderingOrderId],
  );

  const keyExtractor = useCallback((item: Order) => item.id, []);

  const listEmpty = useMemo(() => {
    if (isLoading) return null;
    return <EmptyOrdersState />;
  }, [isLoading]);

  const listFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return (
        <View style={{ paddingVertical: 16 }}>
          <OrderCardSkeleton />
        </View>
      );
    }
    return <View style={{ height: 24 }} />;
  }, [isFetchingNextPage]);

  return (
    <DrawerShell
      isOpen={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}
      header={
        <AppHeader
          showLogo
          onMenuPress={() => setDrawerOpen((open) => !open)}
          isDrawerOpen={drawerOpen}
          footer={
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 4,
              }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: theme.textPrimary }}>
                My Orders
              </Text>
              {isLoggedIn ? (
                <IconButton
                  accessibilityLabel={showSearch ? 'Close search' : 'Search orders'}
                  surface={false}
                  onPress={() => {
                    setShowSearch((v) => !v);
                    void Haptics.selectionAsync();
                  }}>
                  <AppIcon
                    name={showSearch ? 'close' : 'search'}
                    size={ICON_SIZE.header}
                    color={theme.textPrimary}
                  />
                </IconButton>
              ) : (
                <View style={{ width: ICON_SIZE.header + 8 }} />
              )}
            </View>
          }
        />
      }>
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }} edges={[]}>

      {showSearch ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.white,
            paddingHorizontal: 16,
            paddingBottom: 10,
            gap: 8,
            borderBottomWidth: 1,
            borderBottomColor: '#F0F0F0',
          }}>
          <AppIcon name="search" size={ICON_SIZE.action} color={theme.textMuted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by Order ID, product or brand"
            placeholderTextColor={theme.textMuted}
            autoFocus
            style={{
              flex: 1,
              fontSize: 14,
              color: theme.textPrimary,
              paddingVertical: 8,
            }}
          />
          {searchQuery.length > 0 ? (
            <ScaledPressable onPress={() => setSearchQuery('')}>
              <AppIcon name="close" size={ICON_SIZE.action} color={theme.textMuted} />
            </ScaledPressable>
          ) : null}
        </Animated.View>
      ) : null}

      {!isLoggedIn ? (
        <GuestOrdersState />
      ) : isLoading && orders.length === 0 ? (
        <OrdersListSkeleton count={3} />
      ) : error && orders.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 16 }}>
          <CatalogErrorState
            message="Unable to load orders. Check your connection and try again."
            onRetry={() => void refresh()}
          />
        </View>
      ) : (
        <>
          <FilterChips activeFilter={activeFilter} onChange={setActiveFilter} />
          <FlashList
            data={orders}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 30 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={refresh}
                tintColor={theme.primary}
                colors={[theme.primary]}
              />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={listEmpty}
            ListFooterComponent={listFooter}
          />
        </>
      )}
    </SafeAreaView>
    </DrawerShell>
  );
});

export default OrdersScreen;
