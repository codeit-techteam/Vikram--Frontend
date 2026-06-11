import { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyOrdersState } from '@components/orders/EmptyOrdersState';
import { OrderHistoryCard } from '@components/orders/OrderHistoryCard';
import { ScaledPressable } from '@components/ScaledPressable';
import type { Order } from '@store/orderStore';
import { useOrderStore } from '@store/orderStore';
import { formatDateKey } from '@utils/orderDateHelpers';

const FILTERS = [
  { id: 'all', label: 'All Orders' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

interface OrderDateGroup {
  date: string;
  orders: Order[];
}

const ACTIVE_STATUSES = new Set(['processing', 'packed', 'dispatched', 'in_transit']);

function OrderDateGroupSection({ group, showSeparator }: { group: OrderDateGroup; showSeparator: boolean }) {
  return (
    <View style={{ marginBottom: 8 }}>
      {group.orders.map((order) => (
        <View key={order.id}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 6 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#999', letterSpacing: 0.3 }}>
              Order ID: {order.id}
              {'     '}
              <Text style={{ color: '#BBB' }}>{formatDateKey(order.createdAt)}</Text>
            </Text>
          </View>
          <OrderHistoryCard order={order} />
        </View>
      ))}

      {showSeparator ? (
        <View
          style={{
            marginVertical: 8,
            marginHorizontal: 16,
            borderTopWidth: 1,
            borderTopColor: '#E8E8E8',
            borderStyle: 'dashed',
          }}
        />
      ) : null}
    </View>
  );
}

export default function OrdersScreen() {
  const orders = useOrderStore((s) => s.orders);
  const [activeFilter, setActiveFilter] = useState<FilterId>('all');

  const groupedOrders = useMemo(() => {
    const filtered = orders.filter((order) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'active') return ACTIVE_STATUSES.has(order.status);
      if (activeFilter === 'delivered') return order.status === 'delivered';
      if (activeFilter === 'cancelled') return order.status === 'cancelled';
      return true;
    });

    const groups: Record<string, Order[]> = {};
    filtered.forEach((order) => {
      const dateKey = formatDateKey(order.createdAt);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(order);
    });

    return Object.entries(groups).map(([date, dateOrders]) => ({
      date,
      orders: dateOrders.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    }));
  }, [orders, activeFilter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
        }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#1A1A1A' }}>My Orders</Text>
        <ScaledPressable onPress={() => router.push('/search')} hitSlop={10}>
          <Ionicons name="search-outline" size={22} color="#1A1A1A" />
        </ScaledPressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexGrow: 0,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#F0F0F0',
        }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          gap: 8,
          flexDirection: 'row',
        }}>
        {FILTERS.map((filter) => (
          <ScaledPressable
            key={filter.id}
            onPress={() => {
              setActiveFilter(filter.id);
              Haptics.selectionAsync();
            }}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 7,
              borderRadius: 20,
              backgroundColor: activeFilter === filter.id ? '#FEB623' : '#F5F5F5',
              borderWidth: 1,
              borderColor: activeFilter === filter.id ? '#FEB623' : '#E0E0E0',
            }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: activeFilter === filter.id ? '#1A1A1A' : '#666',
              }}>
              {filter.label}
            </Text>
          </ScaledPressable>
        ))}
      </ScrollView>

      <FlatList
        data={groupedOrders}
        keyExtractor={(item) => item.date}
        contentContainerStyle={{ paddingVertical: 12, paddingBottom: 30, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <OrderDateGroupSection
            group={item}
            showSeparator={index < groupedOrders.length - 1}
          />
        )}
        ListEmptyComponent={<EmptyOrdersState />}
      />
    </SafeAreaView>
  );
}
