import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { useLanguageStore, useTranslation } from '@store/languageStore';

export default function LoyaltyScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('loyaltyRewardsTitle')} />
      <View className="mx-5 mt-6 rounded-card bg-primary p-6">
        <Text className="text-sm font-bold text-onPrimary">{t('platinumContractor')}</Text>
        <Text className="mt-2 text-3xl font-bold text-onPrimary">12,450 pts</Text>
        <Text className="mt-2 text-sm text-onPrimary/80">{t('redeemPointsNextOrder')}</Text>
      </View>
    </SafeAreaView>
  );
}
