import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';

const METHODS = [
  { id: 'hdfc', label: 'HDFC Bank (GST Reg)', primary: true, icon: 'business-outline' as const },
  { id: 'upi', label: 'Corporate UPI ID', subtitle: 'premierbuild@hdfcbank', icon: 'phone-portrait-outline' as const },
  { id: 'neft', label: 'NEFT / RTGS', subtitle: 'Account ending 4521', icon: 'swap-horizontal-outline' as const },
];

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-4 py-3">
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/account')}>
          <Ionicons name="arrow-back" size={22} color="#FEB623" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">{t('paymentMethods')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {METHODS.map((method) => (
          <View
            key={method.id}
            className="mb-3 flex-row items-center rounded-card border border-border bg-surface p-4">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Ionicons name={method.icon} size={20} color="#2196F3" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-text">{method.label}</Text>
              {method.subtitle && (
                <Text className="text-xs text-text-secondary">{method.subtitle}</Text>
              )}
            </View>
            {method.primary ? (
              <View className="rounded bg-success/15 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-success">{t('primary')}</Text>
              </View>
            ) : (
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
            )}
          </View>
        ))}

        <ScaledPressable className="mt-2 flex-row items-center justify-center gap-2 rounded-pill border border-dashed border-primary py-3">
          <Ionicons name="add" size={18} color="#FEB623" />
          <Text className="text-sm font-semibold text-primary">{t('addPaymentMethodLabel')}</Text>
        </ScaledPressable>
      </ScrollView>
    </SafeAreaView>
  );
}
