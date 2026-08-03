import { memo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';

import { ScaledPressable } from '@components/ScaledPressable';
import { getCustomerStatusMessage } from '@utils/customerOrderStatus';
import type { OrderStatus } from '@/types/order';
import { borderRadius, theme } from '@constants/theme';

interface CurrentStatusCardProps {
  status: OrderStatus;
  estimatedMinutes?: number | null;
  estimatedArrival?: string | null;
  partnerAssigned?: boolean;
  isDelivered?: boolean;
  deliveredAtLabel?: string | null;
}

export const CurrentStatusCard = memo(function CurrentStatusCard({
  status,
  estimatedMinutes,
  estimatedArrival,
  partnerAssigned,
  isDelivered,
  deliveredAtLabel,
}: CurrentStatusCardProps) {
  if (isDelivered) {
    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={{
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: '#C8E6C9',
          backgroundColor: '#E8F5E9',
          padding: 16,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: theme.success,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="checkmark" size={26} color="#FFF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1B5E20' }}>
              Delivered Successfully
            </Text>
            {deliveredAtLabel ? (
              <Text style={{ fontSize: 13, color: '#2E7D32', marginTop: 4 }}>
                {deliveredAtLabel}
              </Text>
            ) : null}
          </View>
        </View>
      </Animated.View>
    );
  }

  const message = getCustomerStatusMessage(status);
  const showEta = status === 'out_for_delivery';

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.white,
        padding: 16,
        gap: 14,
      }}>
      <View>
        <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
          {message}
        </Text>
        {showEta && estimatedMinutes != null ? (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>Estimated arrival</Text>
            <Text
              style={{
                fontSize: 22,
                fontWeight: '800',
                color: theme.primaryDark,
                marginTop: 2,
              }}>
              {estimatedMinutes} minutes
            </Text>
          </View>
        ) : showEta && estimatedArrival ? (
          <View style={{ marginTop: 10 }}>
            <Text style={{ fontSize: 12, color: theme.textMuted }}>Estimated arrival</Text>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: theme.primaryDark,
                marginTop: 2,
              }}>
              {estimatedArrival}
            </Text>
          </View>
        ) : null}
      </View>

      {status === 'out_for_delivery' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
          }}>
          <Text style={{ fontSize: 13, color: theme.textSecondary }}>Delivery Partner</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textPrimary }}>
            {partnerAssigned ? 'Assigned' : 'Assigning…'}
          </Text>
        </View>
      )}

      <ScaledPressable
        onPress={() => router.push('/support')}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          paddingVertical: 12,
          borderRadius: borderRadius.md,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.ultraLightGray,
        }}>
        <Ionicons name="help-circle-outline" size={18} color={theme.textPrimary} />
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>
          Need Help? Contact Support
        </Text>
      </ScaledPressable>
    </Animated.View>
  );
});
