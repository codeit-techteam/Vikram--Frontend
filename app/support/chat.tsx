import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';

export default function SupportChatScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 border-b border-border px-5 py-4">
        <ScaledPressable onPress={() => safeGoBack('/support')}>
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-lg font-bold text-text">{t('liveChat')}</Text>
        <View className="ml-auto rounded-full bg-success/15 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-success">{t('online')}</Text>
        </View>
      </View>
      <View className="flex-1 justify-end p-5">
        <View className="mb-3 self-start rounded-card rounded-tl-none bg-surface px-4 py-3 shadow-sm">
          <Text className="text-sm text-text">
            Hi Rajesh! I'm your BuildQuick support agent. How can I help with your delivery today?
          </Text>
        </View>
        <Text className="text-center text-xs text-text-secondary">{t('chatPlaceholder')}</Text>
      </View>
    </SafeAreaView>
  );
}
