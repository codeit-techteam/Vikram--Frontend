import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import { useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';

export default function EmergencyOrderScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-5 py-4">
        <ScaledPressable onPress={() => safeGoBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color="#FEB623" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">{t('emergencyOrder')}</Text>
      </View>
      <View className="mx-5 rounded-card bg-[#1A2332] p-6">
        <Text className="text-lg font-bold text-onPrimary">{t('criticalShortage')}</Text>
        <Text className="mt-3 text-sm leading-5 text-onPrimary/80">{t('criticalSubtitle')}</Text>
        <ScaledPressable
          onPress={openVoiceAssistant}
          className="mt-6 items-center rounded-pill bg-primary py-4">
          <Text className="text-base font-bold text-onPrimary">⚡ {t('emergencyOrder')}</Text>
        </ScaledPressable>
      </View>
    </SafeAreaView>
  );
}
