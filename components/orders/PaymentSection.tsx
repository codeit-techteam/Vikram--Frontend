import { memo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import type { PaymentStatus } from '@/types/order';
import { borderRadius, theme } from '@constants/theme';

interface PaymentSectionProps {
  paymentMethod: string;
  paymentMethodLabel?: string;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  onDownloadInvoice?: () => void;
  isDownloading?: boolean;
}

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string; bg: string }
> = {
  paid: { label: 'Paid', color: '#2E7D32', bg: '#E8F5E9' },
  pending: { label: 'Pending', color: '#B8860B', bg: '#FFF8E1' },
  failed: { label: 'Failed', color: '#C62828', bg: '#FFEBEE' },
  refunded: { label: 'Refunded', color: '#1B5E20', bg: '#C8E6C9' },
};

export const PaymentSection = memo(function PaymentSection({
  paymentMethod,
  paymentMethodLabel,
  paymentStatus,
  transactionId,
  onDownloadInvoice,
  isDownloading,
}: PaymentSectionProps) {
  const statusConfig = PAYMENT_STATUS_CONFIG[paymentStatus];

  return (
    <View
      style={{
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.white,
        padding: 16,
      }}>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, color: theme.textMuted }}>
        PAYMENT
      </Text>
      <View style={{ marginTop: 12, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="card-outline" size={18} color={theme.primary} />
            <Text style={{ fontSize: 14, color: theme.textPrimary, fontWeight: '600' }}>
              {paymentMethodLabel ?? paymentMethod.replace(/_/g, ' ')}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: statusConfig.bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: borderRadius.full,
            }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: statusConfig.color }}>
              {statusConfig.label}
            </Text>
          </View>
        </View>
        {transactionId ? (
          <Text style={{ fontSize: 12, color: theme.textMuted }}>
            Transaction ID: {transactionId}
          </Text>
        ) : null}
      </View>
      {onDownloadInvoice ? (
        <ScaledPressable
          onPress={onDownloadInvoice}
          disabled={isDownloading}
          style={{
            marginTop: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.primary,
            borderRadius: borderRadius.md,
            paddingVertical: 12,
            gap: 8,
          }}>
          {isDownloading ? (
            <ActivityIndicator color={theme.textPrimary} />
          ) : (
            <>
              <Ionicons name="download-outline" size={18} color={theme.textPrimary} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>
                Download Invoice
              </Text>
            </>
          )}
        </ScaledPressable>
      ) : null}
    </View>
  );
});
