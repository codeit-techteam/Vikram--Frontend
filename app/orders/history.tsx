import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { ScaledPressable } from '@components/ScaledPressable';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useOrderStore } from '@store/orderStore';
import { formatINR } from '@utils/formatCurrency';
import { safeGoBack } from '@utils/navigation';

export default function OrderHistoryScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const orders = useOrderStore((st) => st.orders);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('orderHistory')} onBack={() => safeGoBack('/(tabs)/orders')} />

      <FlatList
        key={language}
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View className="items-center px-4 py-8">
            <Text className="text-center font-semibold text-text">{t('noOrders')}</Text>
            <Text className="mt-2 text-center text-text-secondary">{t('noOrdersSubtitle')}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <ScaledPressable
            onPress={() => router.push(`/orders/view/${item.id}`)}
            className="mb-3 rounded-card border border-border bg-surface p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-primary">{item.id}</Text>
              <Text className="text-xs capitalize text-text-secondary">{item.status}</Text>
            </View>
            <Text className="mt-1 text-xs text-text-secondary">{item.deliverySite.name}</Text>
            <Text className="mt-2 text-base font-bold text-text">
              {formatINR(item.total, false)}
            </Text>
          </ScaledPressable>
        )}
      />
    </SafeAreaView>
  );
}
