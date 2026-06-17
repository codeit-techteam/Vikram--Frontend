import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import { useTranslation } from '@store/languageStore';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';

const FEATURES = [
  { icon: 'flash' as const, text: 'Delivery in under 90 minutes' },
  { icon: 'time' as const, text: '24/7 available, including weekends' },
  { icon: 'location' as const, text: 'Track driver in real-time' },
  { icon: 'shield-checkmark' as const, text: 'Priority warehouse allocation' },
];

export default function EmergencyOrderScreen() {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <BackHeader title={t('emergencyOrder')} titleColor="#FEB623" backgroundColor="#F5F5F5" borderBottom={false} />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View
          style={{
            backgroundColor: '#1A2340',
            borderRadius: 20,
            padding: 20,
            overflow: 'hidden',
            marginBottom: 20,
          }}>
          <View
            style={{
              position: 'absolute',
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(254,182,35,0.10)',
            }}
          />

          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: '#FFFFFF',
              marginBottom: 8,
              lineHeight: 26,
            }}>
            {t('criticalShortage')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: 'rgba(255,255,255,0.75)',
              lineHeight: 20,
              marginBottom: 20,
            }}>
            {t('criticalSubtitle')}
          </Text>

          <TouchableOpacity
            onPress={openVoiceAssistant}
            style={{
              backgroundColor: GOLD,
              borderRadius: 30,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
            <Text style={{ fontSize: 15, fontWeight: '800', color: DARK }}>{t('emergencyOrder')}</Text>
          </TouchableOpacity>
        </View>

        {FEATURES.map((item, i) => (
          <View
            key={i}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
            }}>
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: '#FFF4D1',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name={item.icon} size={18} color={GOLD} />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '600', color: DARK }}>{item.text}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
