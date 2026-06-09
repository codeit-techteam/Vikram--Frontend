import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';

export default function LoyaltyScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-5 py-4">
        <ScaledPressable onPress={() => safeGoBack()}>
          <Ionicons name="arrow-back" size={22} color="#FEB623" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">{t('loyaltyRewardsTitle')}</Text>
      </View>
      <View className="mx-5 mt-6 rounded-card bg-primary p-6">
        <Text className="text-sm font-bold text-onPrimary">{t('platinumContractor')}</Text>
        <Text className="mt-2 text-3xl font-bold text-onPrimary">12,450 pts</Text>
        <Text className="mt-2 text-sm text-onPrimary/80">{t('redeemPointsNextOrder')}</Text>
      </View>
    </SafeAreaView>
  );
}
