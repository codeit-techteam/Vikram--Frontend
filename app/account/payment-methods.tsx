import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';
import { useUserStore } from '@store/userStore';
import { safeGoBack } from '@utils/navigation';

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);

  const primaryLabel = user.company
    ? `${user.company}${user.gstNumber ? ' (GST Reg)' : ''}`
    : user.gstNumber
      ? `GST ${user.gstNumber}`
      : null;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('paymentMethods')} onBack={() => safeGoBack('/(tabs)/account')} />

      <View className="p-4">
        <View className="overflow-hidden rounded-card border border-border bg-surface">
          {primaryLabel ? (
            <View className="flex-row items-center border-b border-border px-4 py-4">
              <Ionicons name="business-outline" size={22} color="#666666" />
              <View className="ml-3 flex-1">
                <Text className="text-sm font-semibold text-text">{primaryLabel}</Text>
                {user.gstNumber ? (
                  <Text className="mt-0.5 text-xs text-text-secondary">{user.gstNumber}</Text>
                ) : null}
              </View>
              <View className="rounded bg-success/15 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-success">PRIMARY</Text>
              </View>
            </View>
          ) : (
            <View className="px-4 py-6">
              <Text className="text-center text-sm text-text-secondary">
                No business payment profile yet. Add GST details from Business Details.
              </Text>
            </View>
          )}

          <ScaledPressable
            onPress={() => router.push('/account/business-details')}
            className="flex-row items-center px-4 py-4">
            <Ionicons name="receipt-outline" size={22} color="#666666" />
            <Text className="ml-3 flex-1 text-sm text-text">Manage GST / Business Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
          </ScaledPressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
