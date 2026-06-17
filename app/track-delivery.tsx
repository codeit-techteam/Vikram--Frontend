import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';

export default function TrackDeliveryScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('trackDeliveries')} onBack={() => safeGoBack('/(tabs)/orders')} />
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="bus-outline" size={48} color="#FEB623" />
        <Text className="mt-4 text-center text-base text-text-secondary">
          {t('trackDeliveriesEmpty')}
        </Text>
      </View>
    </SafeAreaView>
  );
}
