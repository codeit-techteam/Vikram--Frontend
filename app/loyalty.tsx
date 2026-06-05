import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { safeGoBack } from '@utils/navigation';

export default function LoyaltyScreen() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-5 py-4">
        <ScaledPressable onPress={() => safeGoBack()}>
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">Loyalty & Rewards</Text>
      </View>
      <View className="mx-5 mt-6 rounded-card bg-primary p-6">
        <Text className="text-sm font-bold text-text-inverse">PLATINUM CONTRACTOR</Text>
        <Text className="mt-2 text-3xl font-bold text-text-inverse">12,450 pts</Text>
        <Text className="mt-2 text-sm text-text-inverse/80">Redeem points on your next order</Text>
      </View>
    </SafeAreaView>
  );
}
