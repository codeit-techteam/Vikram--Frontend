import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { VerifiedBadge } from '@components/gst/VerifiedBadge';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useGstStore } from '@store/gstStore';
import { useOrderStore } from '@store/orderStore';

export default function OrderSuccessScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = useOrderStore((s) => (orderId ? s.getOrder(orderId) : undefined));
  const displayId = orderId ?? order?.id ?? 'BJW-982441';
  const hasGst = useGstStore((s) => s.verified);

  const checkScale = useSharedValue(0);
  const [visibleSteps, setVisibleSteps] = useState(0);

  const timeline = useMemo(
    () => [
      { labelKey: 'ordered' as const, sub: 'Today, 10:45 AM', done: true },
      { labelKey: 'processing' as const, sub: t('systemValidated'), done: true },
      { labelKey: 'dispatched' as const, sub: t('expectedIn'), done: false },
      { labelKey: 'delivery' as const, sub: t('arrivalAtSite'), done: false },
    ],
    [t, language],
  );

  useEffect(() => {
    checkScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    setVisibleSteps(0);
    timeline.forEach((_, i) => {
      setTimeout(() => setVisibleSteps((v) => Math.max(v, i + 1)), 300 * (i + 1));
    });
  }, [checkScale, timeline]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          padding: 16,
        }}>
        <TouchableOpacity
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.replace('/(tabs)');
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#F0F0F0',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={18} color="#666" />
        </TouchableOpacity>
      </View>
      <ScrollView key={language} contentContainerStyle={{ padding: 20, paddingBottom: 40, paddingTop: 0 }}>

        <View className="items-center rounded-card border border-border bg-surface p-6">
          <Animated.View
            style={checkStyle}
            className="h-24 w-24 items-center justify-center rounded-full bg-primary">
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </Animated.View>
          <Text className="mt-6 text-2xl font-bold text-text">{t('orderConfirmed')}</Text>
          <Text className="mt-2 text-sm font-semibold text-primary">ID: #{displayId}</Text>

          {hasGst ? (
            <View className="mt-4">
              <VerifiedBadge variant="enabled" label={t('gstInvoiceEnabled')} />
            </View>
          ) : null}

          <View className="mt-6 w-full flex-row gap-3">
            <View className="flex-1 rounded-card bg-trust p-3">
              <Ionicons name="time-outline" size={18} color="#FEB623" />
              <Text className="mt-2 text-[10px] font-bold text-text-secondary">{t('deliveryETA')}</Text>
              <Text className="text-sm font-bold text-text">90 {t('mins')}</Text>
            </View>
            <View className="flex-1 rounded-card bg-trust p-3">
              <Ionicons name="business-outline" size={18} color="#FEB623" />
              <Text className="mt-2 text-[10px] font-bold text-text-secondary">
                {t('assignedWarehouse')}
              </Text>
              <Text className="text-sm font-bold text-text">Mumbai Central</Text>
            </View>
          </View>

          <View className="mt-6 w-full rounded-card border border-border p-4">
            <Text className="text-[10px] font-bold tracking-widest text-text-secondary">
              {t('deliveryTimeline')}
            </Text>
            {timeline.map((step, i) =>
              i < visibleSteps ? (
                <Animated.View
                  key={step.labelKey}
                  entering={FadeInDown.duration(300)}
                  className="mt-4 flex-row gap-3">
                  <View className="items-center">
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full ${
                        step.done ? 'bg-primary' : 'border-2 border-border bg-surface'
                      }`}>
                      {step.done ? (
                        <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      ) : (
                        <View className="h-2 w-2 rounded-full bg-border" />
                      )}
                    </View>
                    {i < timeline.length - 1 && (
                      <View className={`mt-1 h-8 w-0.5 ${step.done ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </View>
                  <View className="flex-1 pb-2">
                    <Text className="text-sm font-bold text-text">{t(step.labelKey)}</Text>
                    <Text className="text-xs text-text-secondary">{step.sub}</Text>
                  </View>
                </Animated.View>
              ) : null,
            )}
          </View>

          <View className="mt-4 w-full flex-row items-start gap-3 rounded-card border border-border p-4">
            <Ionicons name="location-outline" size={20} color="#FEB623" />
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-text-secondary">{t('deliveryAddress')}</Text>
              <Text className="mt-1 text-sm font-bold text-text">
                Site A – Mumbai North Industrial Estate
              </Text>
              <Text className="mt-1 text-xs text-text-secondary">
                {order?.deliverySite.address ?? 'Plot 44-B, Mumbai North Industrial Estate'}
              </Text>
            </View>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=120&q=80',
              }}
              style={{ width: 56, height: 56, borderRadius: 8 }}
              contentFit="cover"
            />
          </View>

          <ScaledPressable
            onPress={() => router.push(`/orders/view/${displayId}`)}
            className="mt-6 w-full items-center rounded-pill bg-primary py-4">
            <Text className="text-base font-bold text-onPrimary">{t('viewOrderBtn')}</Text>
          </ScaledPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
