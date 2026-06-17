import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { PulseDot } from '@components/orders/PulseDot';
import { ScaledPressable } from '@components/ScaledPressable';
import type { StringKey } from '@constants/strings';
import { useTranslation } from '@store/languageStore';

type DisputeType = 'wrong_item' | 'damaged' | 'missing' | 'refund';

const DISPUTE_TYPES: { id: DisputeType; labelKey: StringKey; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'wrong_item', labelKey: 'reportWrongItem', icon: 'cube-outline' },
  { id: 'damaged', labelKey: 'damagedGoods', icon: 'warning-outline' },
  { id: 'missing', labelKey: 'missingQuantity', icon: 'scale-outline' },
  { id: 'refund', labelKey: 'refundRequest', icon: 'return-down-back-outline' },
];

const RESOLUTION_STEP_KEYS: StringKey[] = [
  'ticketRaised',
  'evidenceReceived',
  'underInvestigation',
  'resolutionPending',
];

const RESOLUTION_TIMES = [
  'Oct 24, 09:15 AM',
  'Oct 24, 11:30 AM',
  'In Progress',
  'ETA: 4 Hours',
];

export default function SupportScreen() {
  const { t } = useTranslation();
  const [selectedDispute, setSelectedDispute] = useState<DisputeType>('damaged');
  const [uploads, setUploads] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const borderOpacity = useSharedValue(1);

  const resolutionSteps = useMemo(
    () =>
      RESOLUTION_STEP_KEYS.map((labelKey, i) => ({
        label: t(labelKey),
        time: RESOLUTION_TIMES[i],
        done: i < 2,
        active: i === 2,
      })),
    [t],
  );

  useEffect(() => {
    if (picking) {
      borderOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
      );
    } else {
      borderOpacity.value = withTiming(1);
    }
  }, [picking, borderOpacity]);

  const uploadBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(254, 182, 35, ${borderOpacity.value})`,
  }));

  const pickFiles = async () => {
    setPicking(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    setPicking(false);
    if (!result.canceled) {
      setUploads((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('supportDisputes')} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="text-sm text-text-secondary">
          Reference ID: <Text className="font-bold text-primary">#TIC-9902-X</Text>
        </Text>

        <View className="mt-4 flex-row gap-2">
          <ScaledPressable className="flex-row items-center rounded-full border-2 border-primary px-4 py-2">
            <Ionicons name="time-outline" size={14} color="#FEB623" />
            <Text className="ml-1 text-sm font-semibold text-primary">{t('history')}</Text>
          </ScaledPressable>
          <ScaledPressable className="rounded-full bg-primary px-4 py-2">
            <Text className="text-sm font-bold text-onPrimary">{t('newTicket')}</Text>
          </ScaledPressable>
        </View>

        <View className="mt-5 rounded-card border border-border bg-surface p-4">
          <View className="flex-row justify-between">
            <View className="rounded bg-success/15 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-success">{t('activeDispute')}</Text>
            </View>
            <View className="rounded bg-primary/10 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-primary">{t('inReview')}</Text>
            </View>
          </View>
          <Text className="mt-3 text-base font-bold text-text">
            Order #ORD-8821: Wrong Grade Steel
          </Text>
          <Text className="mt-2 text-sm leading-5 text-text-secondary">
            Structural I-Beams delivered were ASTM A36 instead of requested Grade 50. Inspection
            report attached below.
          </Text>
          <View className="mt-3 flex-row items-center gap-3 rounded-lg bg-trust p-3">
            <Ionicons name="document" size={24} color="#D32F2F" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-text">metallurgy_report_final.pdf</Text>
              <Text className="text-xs text-text-secondary">2.4 MB • Uploaded 2h ago</Text>
            </View>
            <Ionicons name="download-outline" size={20} color="#FEB623" />
          </View>
          <Text className="mt-3 text-xs text-text-secondary">
            👥 Assigned to Logistics Specialist + 2 others
          </Text>
        </View>

        <Text className="mb-3 mt-5 text-base font-bold text-text">{t('resolutionSteps')}</Text>
        {resolutionSteps.map((step, i) => (
          <View key={step.label} className="flex-row gap-3">
            <View className="items-center">
              {step.active ? (
                <PulseDot size={18} />
              ) : (
                <View
                  className={`h-4 w-4 items-center justify-center rounded-full ${
                    step.done ? 'bg-primary' : 'border-2 border-border'
                  }`}>
                  {step.done && <Ionicons name="checkmark" size={10} color="#FFF" />}
                </View>
              )}
              {i < resolutionSteps.length - 1 && (
                <View className={`h-8 w-0.5 ${step.done ? 'bg-primary' : 'bg-border'}`} />
              )}
            </View>
            <View className="flex-1 pb-3">
              <Text className="text-sm font-bold text-text">{step.label}</Text>
              <Text className="text-xs text-text-secondary">{step.time}</Text>
            </View>
          </View>
        ))}

        <Text className="mb-3 mt-4 text-base font-bold text-text">{t('fileNewDispute')}</Text>
        <View className="flex-row flex-wrap gap-3">
          {DISPUTE_TYPES.map((d) => {
            const selected = selectedDispute === d.id;
            return (
              <ScaledPressable
                key={d.id}
                onPress={() => setSelectedDispute(d.id)}
                className={`w-[47%] items-center rounded-card border-2 p-4 ${
                  selected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                }`}
                scaleTo={1.02}>
                <Ionicons name={d.icon} size={24} color={selected ? '#FEB623' : '#666'} />
                <Text
                  className={`mt-2 text-center text-xs font-semibold ${
                    selected ? 'text-primary' : 'text-text-secondary'
                  }`}>
                  {t(d.labelKey)}
                </Text>
              </ScaledPressable>
            );
          })}
        </View>

        <Text className="mb-2 mt-5 text-base font-bold text-text">{t('uploadEvidence')}</Text>
        <Text className="mb-3 text-xs leading-4 text-text-secondary">{t('uploadEvidenceSubtitle')}</Text>
        <Animated.View
          style={[uploadBorderStyle, { borderWidth: 2, borderStyle: 'dashed' }]}
          className="items-center rounded-card bg-trust p-6">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <Ionicons name="cloud-upload-outline" size={28} color="#FEB623" />
          </View>
          <Text className="mt-3 font-bold text-text">{t('dragDropFiles')}</Text>
          <Text className="mt-1 text-xs text-text-secondary">{t('supportsFormats')}</Text>
          <ScaledPressable onPress={pickFiles} className="mt-4 rounded-lg bg-primary px-6 py-3">
            <Text className="font-bold text-onPrimary">{t('selectFiles')}</Text>
          </ScaledPressable>
        </Animated.View>

        {uploads.length > 0 && (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {uploads.map((uri) => (
              <Image key={uri} source={{ uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
            ))}
          </View>
        )}

        <View className="mt-6 gap-3">
          <ScaledPressable
            onPress={() => router.push('/support/chat')}
            className="flex-row items-center justify-between rounded-card border border-border bg-surface p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-trust">
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FEB623" />
              </View>
              <View>
                <Text className="text-sm font-bold text-text">{t('liveChat')}</Text>
                <Text className="text-xs text-success">{t('liveChatSubtitle')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </ScaledPressable>
          <ScaledPressable
            onPress={() => Linking.openURL('tel:+919999999999')}
            className="flex-row items-center justify-between rounded-card border border-border bg-surface p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-trust">
                <Ionicons name="call-outline" size={20} color="#FEB623" />
              </View>
              <View>
                <Text className="text-sm font-bold text-text">{t('callSupportLabel')}</Text>
                <Text className="text-xs text-success">{t('callSupportSubtitle')}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </ScaledPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
