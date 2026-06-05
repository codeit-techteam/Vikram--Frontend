import { FlatList, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useStrings } from '@hooks/useStrings';
import { useOrderStore } from '@store/orderStore';
import { formatINR } from '@utils/formatCurrency';
import { safeGoBack } from '@utils/navigation';

export default function OrderHistoryScreen() {
  const s = useStrings();
  const orders = useOrderStore((st) => st.orders);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-4 py-3">
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/orders')}>
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">{s.drawerOrderHistory}</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <Text className="text-center text-text-secondary">No orders yet</Text>
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
