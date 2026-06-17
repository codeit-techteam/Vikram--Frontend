import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';

export default function BulkProcurementScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('bulkProcurement')} />
      <View className="mx-5 rounded-card bg-primary p-6">
        <Text className="text-lg font-bold text-onPrimary">{t('bulkProcurementTitle')}</Text>
        <Text className="mt-3 text-sm leading-5 text-onPrimary/90">{t('bulkProcurementSubtitle')}</Text>
        <ScaledPressable className="mt-5 items-center rounded-pill border-2 border-surface bg-surface px-8 py-3">
          <Text className="text-sm font-bold text-primary">{t('inquireNow')}</Text>
        </ScaledPressable>
      </View>
    </SafeAreaView>
  );
}
