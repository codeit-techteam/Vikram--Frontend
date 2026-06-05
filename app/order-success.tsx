import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useOrderStore } from '@store/orderStore';

const TIMELINE = [
  { label: 'Ordered', sub: 'Today, 10:45 AM', done: true },
  { label: 'Processing', sub: 'System validated and allocated', done: true },
  { label: 'Dispatched', sub: 'Expected in 30 mins', done: false },
  { label: 'Delivery', sub: 'Arrival at Site A', done: false },
];

export default function OrderSuccessScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = useOrderStore((s) => (orderId ? s.getOrder(orderId) : undefined));
  const displayId = orderId ?? order?.id ?? 'CIQ-982441';

  const checkScale = useSharedValue(0);
  const [visibleSteps, setVisibleSteps] = useState(0);

  useEffect(() => {
    checkScale.value = withSpring(1, { damping: 8, stiffness: 120 });
    TIMELINE.forEach((_, i) => {
      setTimeout(() => setVisibleSteps((v) => Math.max(v, i + 1)), 300 * (i + 1));
    });
  }, [checkScale]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="flex-row items-center justify-between">
          <ScaledPressable
            onPress={() => router.replace('/(tabs)')}
            className="flex-row items-center gap-2">
            <Ionicons name="close" size={22} color="#FF6B00" />
            <Text className="text-lg font-bold text-primary">Order Success</Text>
          </ScaledPressable>
        </View>

        <View className="mt-8 items-center rounded-card border border-border bg-surface p-6">
          <Animated.View
            style={checkStyle}
            className="h-24 w-24 items-center justify-center rounded-full bg-primary">
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </Animated.View>
          <Text className="mt-6 text-2xl font-bold text-text">Order Confirmed</Text>
          <Text className="mt-2 text-sm font-semibold text-primary">ID: #{displayId}</Text>

          <View className="mt-6 w-full flex-row gap-3">
            <View className="flex-1 rounded-card bg-trust p-3">
              <Ionicons name="time-outline" size={18} color="#FF6B00" />
              <Text className="mt-2 text-[10px] font-bold text-text-secondary">DELIVERY ETA</Text>
              <Text className="text-sm font-bold text-text">90 mins</Text>
            </View>
            <View className="flex-1 rounded-card bg-trust p-3">
              <Ionicons name="business-outline" size={18} color="#FF6B00" />
              <Text className="mt-2 text-[10px] font-bold text-text-secondary">
                ASSIGNED WAREHOUSE
              </Text>
              <Text className="text-sm font-bold text-text">Mumbai Central</Text>
            </View>
          </View>

          <View className="mt-6 w-full rounded-card border border-border p-4">
            <Text className="text-[10px] font-bold tracking-widest text-text-secondary">
              DELIVERY TIMELINE
            </Text>
            {TIMELINE.map((step, i) =>
              i < visibleSteps ? (
                <Animated.View
                  key={step.label}
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
                    {i < TIMELINE.length - 1 && (
                      <View className={`mt-1 h-8 w-0.5 ${step.done ? 'bg-primary' : 'bg-border'}`} />
                    )}
                  </View>
                  <View className="flex-1 pb-2">
                    <Text className="text-sm font-bold text-text">{step.label}</Text>
                    <Text className="text-xs text-text-secondary">{step.sub}</Text>
                  </View>
                </Animated.View>
              ) : null,
            )}
          </View>

          <View className="mt-4 w-full flex-row items-start gap-3 rounded-card border border-border p-4">
            <Ionicons name="location-outline" size={20} color="#FF6B00" />
            <View className="flex-1">
              <Text className="text-[10px] font-bold text-text-secondary">DELIVERY ADDRESS</Text>
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
            <Text className="text-base font-bold text-text-inverse">View Order</Text>
          </ScaledPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
