import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';

export default function SupportChatScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader
        title={t('liveChat')}
        onBack={() => safeGoBack('/support')}
        rightElement={
          <View className="rounded-full bg-success/15 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-success">{t('online')}</Text>
          </View>
        }
      />
      <View className="flex-1 justify-end p-5">
        <View className="mb-3 self-start rounded-card rounded-tl-none bg-surface px-4 py-3 shadow-sm">
          <Text className="text-sm text-text">
            Hi Rajesh! I'm your Bajriwala support agent. How can I help with your delivery today?
          </Text>
        </View>
        <Text className="text-center text-xs text-text-secondary">{t('chatPlaceholder')}</Text>
      </View>
    </SafeAreaView>
  );
}
