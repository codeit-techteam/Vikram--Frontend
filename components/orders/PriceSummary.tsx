import { memo } from 'react';
import { Text, View } from 'react-native';

import { formatINR } from '@utils/formatCurrency';
import { borderRadius, theme } from '@constants/theme';

interface PriceSummaryProps {
  subtotal: number;
  gst: number;
  discount?: number;
  couponDiscount?: number;
  deliveryCharge: number;
  platformFee?: number;
  grandTotal: number;
  savings?: number;
}

export const PriceSummary = memo(function PriceSummary({
  subtotal,
  gst,
  discount = 0,
  couponDiscount = 0,
  deliveryCharge,
  platformFee = 0,
  grandTotal,
  savings,
}: PriceSummaryProps) {
  const rows = [
    { label: 'Subtotal', value: formatINR(subtotal, false) },
    { label: 'GST', value: formatINR(gst, false) },
    ...(discount > 0 ? [{ label: 'Discount', value: `-${formatINR(discount, false)}`, green: true }] : []),
    ...(couponDiscount > 0
      ? [{ label: 'Coupon', value: `-${formatINR(couponDiscount, false)}`, green: true }]
      : []),
    {
      label: 'Delivery Charges',
      value: deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge, false),
      green: deliveryCharge === 0,
    },
    ...(platformFee > 0 ? [{ label: 'Platform Fee', value: formatINR(platformFee, false) }] : []),
  ];

  return (
    <View
      style={{
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.white,
        overflow: 'hidden',
      }}>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, color: theme.textMuted }}>
          PRICE BREAKDOWN
        </Text>
        <View style={{ marginTop: 12, gap: 10 }}>
          {rows.map((row) => (
            <View key={row.label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 14, color: theme.textSecondary }}>{row.label}</Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: row.green ? theme.success : theme.textPrimary,
                }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>
      </View>
      <View
        style={{
          backgroundColor: theme.primary,
          paddingHorizontal: 16,
          paddingVertical: 14,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>Grand Total</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color: theme.textPrimary }}>
          {formatINR(grandTotal, false)}
        </Text>
      </View>
      {savings && savings > 0 ? (
        <View
          style={{
            backgroundColor: '#E8F5E9',
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#2E7D32' }}>You saved</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#2E7D32' }}>
            {formatINR(savings, false)}
          </Text>
        </View>
      ) : null}
    </View>
  );
});
