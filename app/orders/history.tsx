import { FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { OrderCard } from '@components/orders/OrderCard';
import { OrderCardSkeleton, OrdersListSkeleton } from '@components/orders/OrderSkeleton';
import { useOrders } from '@hooks/useOrders';
import { useReorder } from '@hooks/useReorder';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { requireAuth } from '@utils/requireAuth';
import { safeGoBack } from '@utils/navigation';

export default function OrderHistoryScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const {
    orders,
    isLoading,
    isFetchingNextPage,
    loadMore,
    hasNextPage,
    prefetchOrder,
  } = useOrders('delivered');
  const { reorder, isReordering, reorderingOrderId } = useReorder();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('orderHistory')} onBack={() => safeGoBack('/(tabs)/orders')} />

      {isLoading && orders.length === 0 ? (
        <OrdersListSkeleton />
      ) : (
        <FlatList
          key={language}
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) loadMore();
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <View className="items-center px-4 py-8">
              <Text className="text-center font-semibold text-text">{t('noOrders')}</Text>
              <Text className="mt-2 text-center text-text-secondary">{t('noOrdersSubtitle')}</Text>
            </View>
          }
          renderItem={({ item, index }) => (
            <OrderCard
              order={item}
              index={index}
              onPress={() => prefetchOrder(item.id)}
              onReorder={async (orderId) => {
                if (!requireAuth('Please log in to reorder.')) return;
                await reorder(orderId);
              }}
              isReordering={isReordering && reorderingOrderId === item.id}
            />
          )}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16 }}>
                <OrderCardSkeleton />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
