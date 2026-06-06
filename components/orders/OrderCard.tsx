import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HighlightedText } from '@components/search/HighlightedText';
import { ScaledPressable } from '@components/ScaledPressable';
import type { StringKey } from '@constants/strings';
import { useTranslation } from '@store/languageStore';
import type { Order } from '@store/orderStore';
import { getOrderImageSource } from '@utils/orderHelpers';
import { formatINR } from '@utils/formatCurrency';

interface OrderCardProps {
  order: Order;
  searchQuery?: string;
}

const BADGE_KEYS: Record<string, StringKey> = {
  'GET READY': 'getReady',
  'BULK SAVINGS': 'bulkSavings',
};

function translateBadge(badge: string, t: (key: StringKey) => string): string {
  const key = BADGE_KEYS[badge];
  return key ? t(key) : badge;
}

export function OrderCard({ order, searchQuery = '' }: OrderCardProps) {
  const { t } = useTranslation();
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
            <Text className="text-[10px] font-bold text-text-inverse">
              {translateBadge(order.badge, t)}
            </Text>
          </View>
        )}
        <ScaledPressable className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-primary/90">
          <Ionicons name="refresh" size={18} color="#FFFFFF" />
        </ScaledPressable>
        {order.isBulkDiscount && !order.badge && (
          <View className="absolute bottom-3 right-3 rounded-full bg-primary px-2 py-0.5">
            <Text className="text-[9px] font-bold text-text-inverse">{t('bulkSavings')}</Text>
          </View>
        )}
      </View>

      <View className="p-4">
        {searchQuery ? (
          <HighlightedText
            text={order.productName}
            query={searchQuery}
            style={{ fontSize: 18, fontWeight: '700', color: '#1A1A1A' }}
            numberOfLines={2}
          />
        ) : (
          <Text className="text-lg font-bold text-text">{order.productName}</Text>
        )}
        <Text className="mt-1 text-sm leading-5 text-text-secondary" numberOfLines={2}>
          {order.description}
        </Text>

        <View className="mt-3 flex-row items-center justify-between">
          <View>
            <Text className="text-base font-bold text-primary">{priceLabel}</Text>
            {order.isBulkDiscount && order.bulkDiscountLabel && (
              <Text className="text-xs font-semibold text-primary">{t('bulkDiscount')}</Text>
            )}
          </View>
          {order.minUnits && (
            <View className="rounded-full border border-border bg-background px-2 py-1">
              <Text className="text-[10px] font-semibold text-text-secondary">
                {t('minUnits').replace('{{count}}', String(order.minUnits))}
              </Text>
            </View>
          )}
        </View>

        <View className="mt-4 flex-row gap-2">
          <ScaledPressable
            onPress={() => router.push(`/orders/view/${order.id}`)}
            className="flex-[0.7] items-center rounded-lg bg-primary py-3">
            <Text className="text-sm font-bold text-text-inverse">{t('viewOrder')}</Text>
          </ScaledPressable>
          <ScaledPressable
            onPress={() => router.push(`/orders/details/${order.id}`)}
            className="flex-[0.28] items-center rounded-lg border border-border py-3">
            <Text className="text-sm font-semibold text-text-secondary">{t('details')}</Text>
          </ScaledPressable>
        </View>
      </View>
    </View>
  );
}
