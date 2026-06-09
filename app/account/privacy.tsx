import { ScrollView, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';

export default function PrivacyScreen() {
  const { t } = useTranslation();
  const [biometric, setBiometric] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [dataSharing, setDataSharing] = useState(true);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-4 py-3">
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/account')}>
          <Ionicons name="arrow-back" size={22} color="#FEB623" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">{t('privacySecurity')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <PrivacyRow
          icon="finger-print-outline"
          title={t('privacyBiometric')}
          subtitle={t('privacyBiometricDesc')}
          value={biometric}
          onValueChange={setBiometric}
        />
        <PrivacyRow
          icon="shield-checkmark-outline"
          title={t('privacyTwoFactor')}
          subtitle={t('privacyTwoFactorDesc')}
          value={twoFactor}
          onValueChange={setTwoFactor}
        />
        <PrivacyRow
          icon="analytics-outline"
          title={t('privacyAnalytics')}
          subtitle={t('privacyAnalyticsDesc')}
          value={dataSharing}
          onValueChange={setDataSharing}
        />

        <View className="mt-4 rounded-card border border-border bg-surface p-4">
          <Text className="text-sm font-bold text-text">{t('privacyDataTitle')}</Text>
          <Text className="mt-2 text-xs leading-5 text-text-secondary">{t('privacyDataBody')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrivacyRow({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  return (
    <View className="mb-3 flex-row items-center rounded-card border border-border bg-surface p-4">
      <Ionicons name={icon} size={22} color="#FEB623" />
      <View className="ml-3 flex-1">
        <Text className="text-sm font-bold text-text">{title}</Text>
        <Text className="text-xs text-text-secondary">{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#E0E0E0', true: '#FFB380' }}
        thumbColor={value ? '#FEB623' : '#FFFFFF'}
      />
    </View>
  );
}
