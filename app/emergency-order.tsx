import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useStrings } from '@hooks/useStrings';
import { safeGoBack } from '@utils/navigation';

export default function EmergencyOrderScreen() {
  const s = useStrings();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-5 py-4">
        <ScaledPressable onPress={() => safeGoBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">Emergency Order</Text>
      </View>
      <View className="mx-5 rounded-card bg-[#1A2332] p-6">
        <Text className="text-lg font-bold text-text-inverse">{s.criticalShortage}</Text>
        <Text className="mt-3 text-sm leading-5 text-text-inverse/80">{s.emergencySubtitle}</Text>
        <ScaledPressable
          onPress={() => router.push('/voice-assistant')}
          className="mt-6 items-center rounded-pill bg-primary py-4">
          <Text className="text-base font-bold text-text-inverse">⚡ {s.emergencyOrder}</Text>
        </ScaledPressable>
      </View>
    </SafeAreaView>
  );
}
