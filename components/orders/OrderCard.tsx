import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import type { Order } from '@store/orderStore';
import { getOrderImageSource } from '@utils/orderHelpers';
import { formatINR } from '@utils/formatCurrency';

interface OrderCardProps {
  order: Order;
}

export function OrderCard({ order }: OrderCardProps) {
  const priceLabel = `${formatINR(order.price, false)} /${order.unit}`;

  return (
    <View className="mb-5 overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <View className="relative" style={{ height: 160 }}>
        <Image
          source={getOrderImageSource(order.imageSearch)}
          style={{ width: '100%', height: 160, borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
          contentFit="cover"
        />
        {order.badge && (
          <View className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1">
            <Text className="text-[10px] font-bold text-text-inverse">{order.badge}</Text>
          </View>
        )}
        <ScaledPressable className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-primary/90">
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
        </ScaledPressable>
        {order.isBulkDiscount && !order.badge && (
          <View className="absolute bottom-3 right-3 rounded-full bg-primary px-2 py-0.5">
            <Text className="text-[9px] font-bold text-text-inverse">Bulk Savings</Text>
          </View>
        )}
      </View>

      <View className="p-4">
        <Text className="text-lg font-bold text-text">{order.productName}</Text>
        <Text className="mt-1 text-sm leading-5 text-text-secondary" numberOfLines={2}>
          {order.description}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <View>
            <Text className="text-base font-bold text-primary">{priceLabel}</Text>
            {order.isBulkDiscount && order.bulkDiscountLabel && (
              <Text className="text-xs font-semibold text-primary">{order.bulkDiscountLabel}</Text>
            )}
          </View>
          {order.minUnits && (
            <View className="rounded-full border border-border bg-background px-2 py-1">
              <Text className="text-[10px] font-semibold text-text-secondary">
                Min. {order.minUnits} units
              </Text>
            </View>
          )}
        </View>

        <View className="mt-4 flex-row gap-2">
          <ScaledPressable
            onPress={() => router.push(`/orders/view/${order.id}`)}
            className="flex-[0.7] items-center rounded-lg bg-primary py-3">
            <Text className="text-sm font-bold text-text-inverse">View Order</Text>
          </ScaledPressable>
          <ScaledPressable
            onPress={() => router.push(`/orders/details/${order.id}`)}
            className="flex-[0.28] items-center rounded-lg border border-border py-3">
            <Text className="text-sm font-semibold text-text-secondary">Details</Text>
          </ScaledPressable>
        </View>
      </View>
    </View>
  );
}
