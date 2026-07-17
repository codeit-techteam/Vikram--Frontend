import { memo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import { PulseDot } from '@components/orders/PulseDot';
import { TIMELINE_STEPS } from '@constants/orderStatus';
import type { OrderStatus, TimelineStep } from '@/types/order';
import { borderRadius, theme } from '@constants/theme';

interface OrderTimelineProps {
  steps: TimelineStep[];
  animated?: boolean;
}

export const OrderTimeline = memo(function OrderTimeline({
  steps,
  animated = true,
}: OrderTimelineProps) {
  return (
    <View
      style={{
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.white,
        padding: 16,
      }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          letterSpacing: 1,
          color: theme.textMuted,
          marginBottom: 4,
        }}>
        ORDER STATUS
      </Text>
      {steps.map((step, index) => {
        const content = (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <View style={{ alignItems: 'center' }}>
              {step.active ? (
                <PulseDot size={22} />
              ) : (
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: step.done ? theme.success : 'transparent',
                    borderWidth: step.done ? 0 : 2,
                    borderColor: theme.border,
                  }}>
                  {step.done ? <Ionicons name="checkmark" size={12} color="#FFF" /> : null}
                </View>
              )}
              {index < steps.length - 1 ? (
                <View
                  style={{
                    width: 2,
                    flex: 1,
                    minHeight: 32,
                    marginTop: 4,
                    backgroundColor: step.done ? theme.success : theme.border,
                  }}
                />
              ) : null}
            </View>
            <View style={{ flex: 1, paddingBottom: index < steps.length - 1 ? 8 : 0 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: step.active ? theme.primary : step.done ? theme.textPrimary : theme.textMuted,
                }}>
                {step.label}
              </Text>
              {step.time ? (
                <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>
                  {step.time}
                </Text>
              ) : null}
            </View>
          </View>
        );

        if (animated) {
          return (
            <Animated.View key={step.key} entering={FadeInLeft.delay(index * 120).duration(300)}>
              {content}
            </Animated.View>
          );
        }

        return <View key={step.key}>{content}</View>;
      })}
    </View>
  );
});

export function buildTimelineFromStatus(status: OrderStatus, times?: string[]): TimelineStep[] {
  const statusOrder: OrderStatus[] = [
    'pending',
    'confirmed',
    'packed',
    'ready_for_dispatch',
    'out_for_delivery',
    'delivered',
  ];

  const currentIndex = statusOrder.indexOf(
    status === 'processing' ? 'confirmed' : status === 'refunded' ? 'delivered' : status,
  );

  return TIMELINE_STEPS.map((step, index) => ({
    key: step.key,
    label: step.label,
    time: times?.[index],
    done: index < currentIndex,
    active: index === currentIndex,
  }));
}

interface ActiveProgressProps {
  currentIndex: number;
}

export const ActiveOrderProgress = memo(function ActiveOrderProgress({
  currentIndex,
}: ActiveProgressProps) {
  const steps = ['Confirmed', 'Packed', 'Out For Delivery', 'Delivered'];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 4 }}>
      {steps.map((label, index) => (
        <View key={label} style={{ flex: 1, alignItems: 'center' }}>
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: index <= currentIndex ? theme.primary : theme.ultraLightGray,
              borderWidth: index <= currentIndex ? 0 : 1,
              borderColor: theme.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {index < currentIndex ? (
              <Ionicons name="checkmark" size={12} color={theme.textPrimary} />
            ) : (
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: index === currentIndex ? theme.textPrimary : theme.border,
                }}
              />
            )}
          </View>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 9,
              fontWeight: index === currentIndex ? '700' : '500',
              color: index <= currentIndex ? theme.textPrimary : theme.textMuted,
              marginTop: 4,
              textAlign: 'center',
            }}>
            {label}
          </Text>
          {index < steps.length - 1 ? (
            <View
              style={{
                position: 'absolute',
                top: 11,
                left: '55%',
                right: '-45%',
                height: 2,
                backgroundColor: index < currentIndex ? theme.primary : theme.border,
                zIndex: -1,
              }}
            />
          ) : null}
        </View>
      ))}
    </View>
  );
});
