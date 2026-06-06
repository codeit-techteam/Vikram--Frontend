import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';

export default function TrackDeliveryScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-5 py-4">
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/orders')}>
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">{t('trackDeliveries')}</Text>
      </View>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="bus-outline" size={48} color="#FF6B00" />
        <Text className="mt-4 text-center text-base text-text-secondary">
          {t('trackDeliveriesEmpty')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
