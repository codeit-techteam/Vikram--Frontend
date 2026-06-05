import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useStrings } from '@hooks/useStrings';
import { safeGoBack } from '@utils/navigation';
import { useUserStore } from '@store/userStore';
import { formatINR } from '@utils/formatCurrency';

export default function LoyaltyWalletScreen() {
  const s = useStrings();
  const user = useUserStore((st) => st.user);
  const points = 12450;
  const walletBalance = 8450;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-4 py-3">
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/account')}>
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">{s.drawerLoyalty}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="mb-4 rounded-card border border-border bg-surface p-5">
          <Text className="text-sm text-text-secondary">Available Points</Text>
          <Text className="mt-1 text-3xl font-bold text-primary">
            {points.toLocaleString('en-IN')}
          </Text>
          <Text className="mt-1 text-xs text-text-secondary">
            {user.memberTier.toUpperCase()} tier — {user.name}
          </Text>
        </View>

        <View className="mb-4 rounded-card border border-border bg-surface p-5">
          <Text className="text-sm text-text-secondary">Wallet Balance</Text>
          <Text className="mt-1 text-2xl font-bold text-text">{formatINR(walletBalance, false)}</Text>
          <Text className="mt-2 text-xs text-text-secondary">
            Redeem points on your next procurement order
          </Text>
        </View>

        <Text className="mb-2 text-xs font-semibold uppercase text-text-secondary">
          Recent Activity
        </Text>
        {[
          { label: 'Order CIQ-88294 — Points earned', value: '+450' },
          { label: 'Redeemed on checkout', value: '-200' },
          { label: 'Referral bonus', value: '+1000' },
        ].map((item) => (
          <View
            key={item.label}
            className="mb-2 flex-row items-center justify-between rounded-card border border-border bg-surface p-4">
            <Text className="flex-1 text-sm text-text">{item.label}</Text>
            <Text
              className={`text-sm font-bold ${item.value.startsWith('+') ? 'text-success' : 'text-primary'}`}>
              {item.value}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
