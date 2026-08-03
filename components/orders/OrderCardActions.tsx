import { memo, useCallback } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
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
  isReordering,
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

  const handleViewInvoice = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push({
      pathname: '/invoice/[invoiceId]',
      params: {
        invoiceId: order.invoiceId || order.invoiceNumber || order.id,
        orderId: order.id,
      },
    });
  }, [order.id, order.invoiceId, order.invoiceNumber]);

  const actions = getActionsForStatus(order.status);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
      {actions.includes('track') ? (
        <ActionButton label="Track Order" primary onPress={handleTrack} icon="navigate-outline" />
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
        <ActionButton label="Invoice" onPress={handleViewInvoice} icon="document-outline" />
      ) : null}
    </View>
  );
});

function getActionsForStatus(status: Order['status']): string[] {
  switch (status) {
    case 'out_for_delivery':
    case 'ready_for_dispatch':
    case 'pending':
    case 'confirmed':
    case 'processing':
    case 'packed':
      return ['track'];
    case 'delivered':
    case 'refunded':
      return ['details', 'reorder', 'invoice'];
    case 'cancelled':
    case 'payment_failed':
      return ['details', 'reorder'];
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
