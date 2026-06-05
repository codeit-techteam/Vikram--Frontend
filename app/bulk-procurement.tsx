import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useStrings } from '@hooks/useStrings';
import { safeGoBack } from '@utils/navigation';

export default function BulkProcurementScreen() {
  const s = useStrings();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-5 py-4">
        <ScaledPressable onPress={() => safeGoBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">Bulk Procurement</Text>
      </View>
      <View className="mx-5 rounded-card bg-primary p-6">
        <Text className="text-lg font-bold text-text-inverse">{s.bulkProcurementTitle}</Text>
        <Text className="mt-3 text-sm leading-5 text-text-inverse/90">{s.bulkProcurementDesc}</Text>
        <ScaledPressable className="mt-5 items-center rounded-pill border-2 border-surface bg-surface px-8 py-3">
          <Text className="text-sm font-bold text-primary">{s.inquireNow}</Text>
        </ScaledPressable>
      </View>
    </SafeAreaView>
  );
}
