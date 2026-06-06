import { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import type BottomSheet from '@gorhom/bottom-sheet';

import { DrawerShell } from '@components/DrawerShell';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import { OrderCard } from '@components/orders/OrderCard';
import { OrdersSearchEmpty } from '@components/orders/OrdersSearchEmpty';
import {
  OrderFilterSheet,
  type OrderFilters,
} from '@components/orders/OrderFilterSheet';
import { OrderSortSheet } from '@components/orders/OrderSortSheet';
import { AppHeader } from '@components/AppHeader';
import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';
import { useOrderStore } from '@store/orderStore';
import { filterOrders } from '@utils/filterOrders';
import { sortOrders, type OrderSortOption } from '@utils/sortOrders';

export default function OrdersScreen() {
  const { t } = useTranslation();
  const orders = useOrderStore((s) => s.orders);
  const proTipDismissed = useOrderStore((s) => s.proTipDismissed);
  const dismissProTip = useOrderStore((s) => s.dismissProTip);
  const refreshOrders = useOrderStore((s) => s.refreshOrders);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'recent' | 'filter' | 'sort'>('recent');
  const [filters, setFilters] = useState<OrderFilters>({ status: 'all', date: 'all' });
  const [sortOption, setSortOption] = useState<OrderSortOption>('newest');

  const filterSheetRef = useRef<BottomSheet>(null);
  const sortSheetRef = useRef<BottomSheet>(null);

  const hasActiveFilters = filters.status !== 'all' || filters.date !== 'all';
  const hasCustomSort = sortOption !== 'newest';

  const filtered = useMemo(() => {
    const matched = filterOrders(orders, searchQuery, filters);
    return sortOrders(matched, sortOption);
  }, [orders, searchQuery, filters, sortOption]);

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;
  const clearSearch = useCallback(() => setSearchQuery(''), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refreshOrders();
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, [refreshOrders]);

  const openFilter = () => {
    sortSheetRef.current?.close();
    setActiveFilter('filter');
    filterSheetRef.current?.expand();
  };

  const openSort = () => {
    filterSheetRef.current?.close();
    setActiveFilter('sort');
    sortSheetRef.current?.expand();
  };

  const resetToRecent = () => {
    filterSheetRef.current?.close();
    sortSheetRef.current?.close();
    setActiveFilter('recent');
    setFilters({ status: 'all', date: 'all' });
    setSortOption('newest');
  };

  return (
    <DrawerShell
      isOpen={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}>
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />

      <View
        className={`mx-5 flex-row items-center rounded-input border bg-surface px-4 ${
          searchFocused ? 'border-primary' : 'border-border'
        }`}
        style={{ height: 48 }}>
        <Ionicons name="search" size={20} color="#FF6B00" />
        <TextInput
          className="ml-3 flex-1 text-sm text-text"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('searchOrdersPlaceholder')}
          placeholderTextColor="#AAAAAA"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {trimmedQuery.length > 0 ? (
          <ScaledPressable onPress={clearSearch} hitSlop={10}>
            <Ionicons name="close-circle" size={20} color="#BBBBBB" />
          </ScaledPressable>
        ) : (
          <ScaledPressable onPress={openVoiceAssistant} hitSlop={10}>
            <Ionicons name="mic-outline" size={20} color="#FF6B00" />
          </ScaledPressable>
        )}
      </View>

      <View className="mx-5 mt-4 flex-row gap-2">
        <ScaledPressable
          onPress={openFilter}
          className={`flex-row items-center rounded-full px-4 py-2 ${
            activeFilter === 'filter' || hasActiveFilters
              ? 'border-2 border-primary'
              : 'border border-border'
          }`}>
          <Ionicons name="options-outline" size={14} color="#666" />
          <Text className="ml-1 text-sm font-semibold text-text-secondary">{t('filter')}</Text>
        </ScaledPressable>
        <ScaledPressable
          onPress={openSort}
          className={`flex-row items-center rounded-full px-4 py-2 ${
            activeFilter === 'sort' || hasCustomSort
              ? 'border-2 border-primary'
              : 'border border-border'
          }`}>
          <Ionicons name="swap-vertical" size={14} color="#666" />
          <Text className="ml-1 text-sm font-semibold text-text-secondary">{t('sort')}</Text>
        </ScaledPressable>
        <ScaledPressable
          onPress={resetToRecent}
          className={`rounded-full px-4 py-2 ${
            activeFilter === 'recent' && !hasActiveFilters && !hasCustomSort
              ? 'bg-primary'
              : 'border border-border'
          }`}>
          <Text
            className={`text-sm font-semibold ${
              activeFilter === 'recent' && !hasActiveFilters && !hasCustomSort
                ? 'text-text-inverse'
                : 'text-text-secondary'
            }`}>
            {t('recentOrders')}
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
            <OrderCard order={item} searchQuery={trimmedQuery} />
          </Animated.View>
        )}
        ListEmptyComponent={
          isSearching ? (
            <OrdersSearchEmpty query={trimmedQuery} onClear={clearSearch} />
          ) : (
            <View className="items-center px-8 pt-12">
              <Text className="text-4xl">📦</Text>
              <Text className="mt-4 text-lg font-semibold text-text">{t('noOrders')}</Text>
              <Text className="mt-2 text-center text-sm text-text-secondary">
                {t('noOrdersSubtitle')}
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          !proTipDismissed ? (
            <View className="relative overflow-hidden rounded-card bg-primary p-5">
              <ScaledPressable
                onPress={dismissProTip}
                className="absolute right-3 top-3 z-10 h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <Ionicons name="close" size={16} color="#FFFFFF" />
              </ScaledPressable>
              <View className="self-start rounded-full bg-white/20 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-text-inverse">{t('proTip')}</Text>
              </View>
              <Text className="mt-2 text-lg font-bold text-text-inverse">{t('proTipTitle')}</Text>
              <Text className="mt-2 text-sm leading-5 text-text-inverse/90">{t('proTipBody')}</Text>
              <Text className="mt-3 text-xs text-text-inverse/80">⏰ {t('nextSlot')}</Text>
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

      <OrderSortSheet
        ref={sortSheetRef}
        sortOption={sortOption}
        onSelect={(option) => {
          setSortOption(option);
          setActiveFilter('sort');
          sortSheetRef.current?.close();
        }}
      />
    </SafeAreaView>
    </DrawerShell>
  );
}
