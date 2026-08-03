import { memo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft } from 'react-native-reanimated';

import { PulseDot } from '@components/orders/PulseDot';
import { CUSTOMER_PROGRESS_STEPS } from '@utils/customerOrderStatus';
import type { OrderStatus, TimelineStep } from '@/types/order';
import { buildCustomerTimeline } from '@utils/customerOrderStatus';
import { borderRadius, theme } from '@constants/theme';

interface OrderTimelineProps {
  steps: TimelineStep[];
  animated?: boolean;
  title?: string;
}

export const OrderTimeline = memo(function OrderTimeline({
  steps,
  animated = true,
  title = 'ORDER STATUS',
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
        {title}
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
                <TimelineConnector done={Boolean(step.done)} />
              ) : null}
            </View>
            <View style={{ flex: 1, paddingBottom: index < steps.length - 1 ? 8 : 0 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: step.active
                    ? theme.primaryDark
                    : step.done
                      ? theme.textPrimary
                      : theme.textMuted,
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
            <Animated.View
              key={`${step.key}-${index}`}
              entering={FadeInLeft.delay(index * 80).duration(300)}>
              {content}
            </Animated.View>
          );
        }

        return <View key={`${step.key}-${index}`}>{content}</View>;
      })}
    </View>
  );
});

function TimelineConnector({ done }: { done: boolean }) {
  return (
    <View
      style={{
        width: 2,
        flex: 1,
        minHeight: 32,
        marginTop: 4,
        backgroundColor: done ? theme.success : theme.border,
      }}
    />
  );
}

export function buildTimelineFromStatus(status: OrderStatus, times?: string[]): TimelineStep[] {
  const steps = buildCustomerTimeline(status);
  if (!times?.length) return steps;
  return steps.map((step, index) => ({
    ...step,
    time: times[index] ?? step.time,
  }));
}

interface ActiveProgressProps {
  currentIndex: number;
}

export const ActiveOrderProgress = memo(function ActiveOrderProgress({
  currentIndex,
}: ActiveProgressProps) {
  const steps = CUSTOMER_PROGRESS_STEPS;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 4 }}>
      {steps.map((step, index) => (
        <View key={step.key} style={{ flex: 1, alignItems: 'center' }}>
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
            {step.label}
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
