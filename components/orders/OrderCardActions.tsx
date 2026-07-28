import { memo, useCallback } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { CANCELLABLE_STATUSES } from '@constants/orderStatus';
import type { Order } from '@/types/order';
import { borderRadius, theme } from '@constants/theme';

interface OrderCardActionsProps {
  order: Order;
  onReorder?: (orderId: string) => void;
  onCancel?: (orderId: string) => void;
  isReordering?: boolean;
  isCancelling?: boolean;
}

export const OrderCardActions = memo(function OrderCardActions({
  order,
  onReorder,
  onCancel,
  isReordering,
  isCancelling,
}: OrderCardActionsProps) {
  const handleTrack = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push(`/orders/details/${order.id}`);
  }, [order.id]);

  const handleDetails = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push(`/orders/view/${order.id}`);
  }, [order.id]);

  const handleReorder = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onReorder?.(order.id);
  }, [order.id, onReorder]);

  const handleCancel = useCallback(() => {
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: () => onCancel?.(order.id),
      },
    ]);
  }, [order.id, onCancel]);

  const handleContactDriver = useCallback(() => {
    const phone = order.driver?.phone ?? order.tracking?.driver?.phone;
    if (phone) Linking.openURL(`tel:${phone}`);
  }, [order.driver, order.tracking?.driver?.phone]);

  const actions = getActionsForStatus(order.status);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {actions.includes('track') ? (
        <ActionButton label="Track Order" primary onPress={handleTrack} icon="navigate-outline" />
      ) : null}
      {actions.includes('contact') ? (
        <ActionButton label="Contact Driver" onPress={handleContactDriver} icon="call-outline" />
      ) : null}
      {actions.includes('details') ? (
        <ActionButton
          label={
            order.status === 'delivered' || order.status === 'refunded'
              ? 'View Order Details'
              : 'View Details'
          }
          onPress={handleDetails}
          icon="eye-outline"
        />
      ) : null}
      {actions.includes('reorder') ? (
        <ActionButton
          label={isReordering ? 'Adding…' : 'Order Again'}
          primary
          onPress={handleReorder}
          icon="refresh-outline"
          disabled={isReordering}
        />
      ) : null}
      {actions.includes('invoice') ? (
        <ActionButton label="Invoice" onPress={handleDetails} icon="document-outline" />
      ) : null}
      {actions.includes('rate') ? (
        <ActionButton label="Rate Order" onPress={handleDetails} icon="star-outline" />
      ) : null}
      {actions.includes('cancel') && CANCELLABLE_STATUSES.includes(order.status) ? (
        <ActionButton
          label={isCancelling ? 'Cancelling…' : 'Cancel Order'}
          destructive
          onPress={handleCancel}
          icon="close-circle-outline"
          disabled={isCancelling}
        />
      ) : null}
    </View>
  );
});

function getActionsForStatus(status: Order['status']): string[] {
  switch (status) {
    case 'out_for_delivery':
    case 'ready_for_dispatch':
      return ['track', 'contact'];
    case 'delivered':
    case 'refunded':
      return ['details', 'reorder', 'invoice', 'rate'];
    case 'cancelled':
    case 'payment_failed':
      return ['details', 'reorder'];
    case 'confirmed':
    case 'pending':
      return ['details', 'cancel'];
    case 'processing':
    case 'packed':
      return ['details', 'track'];
    default:
      return ['details'];
  }
}

function ActionButton({
  label,
  onPress,
  primary,
  destructive,
  icon,
  disabled,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
  destructive?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
}) {
  return (
    <ScaledPressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: borderRadius.md,
        backgroundColor: primary
          ? theme.primary
          : destructive
            ? '#FFEBEE'
            : theme.ultraLightGray,
        borderWidth: primary || destructive ? 0 : 1,
        borderColor: theme.border,
        opacity: disabled ? 0.6 : 1,
      }}>
      <Ionicons
        name={icon}
        size={15}
        color={destructive ? theme.error : theme.textPrimary}
      />
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: destructive ? theme.error : theme.textPrimary,
        }}>
        {label}
      </Text>
    </ScaledPressable>
  );
}
