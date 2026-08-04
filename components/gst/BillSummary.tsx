import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CartItemImage } from '@components/cart/CartItemImage';
import { ProductUnit } from '@components/product/ProductUnit';
import { VerifiedBadge } from '@components/gst/VerifiedBadge';
import { getLineTotal, type CartItem } from '@store/cartStore';
import { useTranslation } from '@store/languageStore';
import { formatINR } from '@utils/formatCurrency';
import type { GstPricingAdjustment, GstUiState } from '@/types/gst';

export type BillSummaryProps = {
  items: CartItem[];
  subtotal: number;
  deliveryCharge: number;
  loadingCharges: number;
  unloadingCharges: number;
  loyaltyRedemption: number;
  checkoutTotal: number;
  corporateSavings: number;
  bikeDelivery: boolean;
  gstUiState: GstUiState;
  gstBusinessDiscount?: number;
  gstDiscountPercent?: number;
  preDiscountTotal?: number;
  pricingAdjustments?: GstPricingAdjustment[];
};

function ChargeRow({
  label,
  value,
  valueClassName = '',
  labelClassName = '',
}: {
  label: string;
  value: string;
  valueClassName?: string;
  labelClassName?: string;
}) {
  return (
    <View className="flex-row justify-between items-center">
      <Text className={`text-sm flex-1 pr-2 ${labelClassName || 'text-text-secondary'}`}>
        {label}
      </Text>
      <Text className={`text-sm font-semibold ${valueClassName}`}>{value}</Text>
    </View>
  );
}

export function BillSummary({
  items,
  subtotal,
  deliveryCharge,
  loadingCharges,
  unloadingCharges,
  loyaltyRedemption,
  checkoutTotal,
  corporateSavings,
  bikeDelivery,
  gstUiState,
  gstBusinessDiscount = 0,
  gstDiscountPercent = 18,
  preDiscountTotal,
  pricingAdjustments = [],
}: BillSummaryProps) {
  const { t } = useTranslation();
  const gstVerified = gstUiState === 'VERIFIED';
  const hasGstDiscount = gstVerified && gstBusinessDiscount > 0;
  const showStrikethrough =
    hasGstDiscount && preDiscountTotal != null && preDiscountTotal > checkoutTotal;

  return (
    <View className="mb-3 rounded-card border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-bold text-text">{t('billDetails')}</Text>
        <View className="rounded-full bg-primary/10 px-2 py-0.5">
          <Text className="text-[10px] font-bold text-primary">
            {items.length} {t('activeItems').toUpperCase()}
          </Text>
        </View>
      </View>

      {items.map((item) => (
        <View key={item.id} className="mt-3 flex-row items-center gap-3">
          <CartItemImage
            item={item}
            style={{ width: 48, height: 48, borderRadius: 8 }}
            size={48}
            padding={6}
            borderRadius={8}
          />
          <View className="flex-1">
            <Text className="text-sm font-bold text-text" numberOfLines={1}>
              {item.name}
            </Text>
            <ProductUnit
              unit={item.unit}
              quantity={item.quantity}
              variant="inline"
              style={{ fontSize: 12, color: '#888888' }}
            />
          </View>
          <Text className="text-sm font-bold text-text">{formatINR(getLineTotal(item))}</Text>
        </View>
      ))}

      <View className="mt-3 gap-2">
        <ChargeRow label={t('subtotal')} value={formatINR(subtotal)} />
        <ChargeRow
          label={t('deliveryCharge')}
          value={bikeDelivery || deliveryCharge === 0 ? t('free') : formatINR(deliveryCharge)}
          valueClassName={bikeDelivery || deliveryCharge === 0 ? 'text-success' : ''}
        />
        <ChargeRow label={t('loadingCharges')} value={formatINR(loadingCharges)} />
        <ChargeRow label={t('unloadingCharges')} value={formatINR(unloadingCharges)} />
        {loyaltyRedemption > 0 && (
          <ChargeRow
            label={t('loyaltyRedemption')}
            value={`-${formatINR(loyaltyRedemption)}`}
            valueClassName="text-primary"
          />
        )}
        {pricingAdjustments.map((row) => (
          <ChargeRow
            key={row.id}
            label={row.label}
            value={row.amount < 0 ? `-${formatINR(Math.abs(row.amount))}` : formatINR(row.amount)}
            valueClassName={row.amount < 0 ? 'text-success' : ''}
          />
        ))}
        {hasGstDiscount ? (
          <Animated.View entering={FadeInDown.duration(260)}>
            <View className="flex-row justify-between items-center rounded-lg bg-success/8 border border-success/20 px-3 py-2.5 mt-1">
              <View className="flex-row items-center gap-2 flex-1 pr-2">
                <View className="h-7 w-7 items-center justify-center rounded-full bg-success/20">
                  <Ionicons name="pricetag" size={14} color="#34C759" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-success">
                    {t('gstBusinessDiscountApplied')} ({gstDiscountPercent}%)
                  </Text>
                  <Text className="text-[10px] text-text-secondary mt-0.5">
                    {t('gstBusinessDiscountNote')}
                  </Text>
                </View>
              </View>
              <Text className="text-sm font-800 font-bold text-success">
                -{formatINR(gstBusinessDiscount)}
              </Text>
            </View>
          </Animated.View>
        ) : null}
      </View>

      {gstVerified ? (
        <Animated.View
          entering={FadeInDown.duration(280).delay(60)}
          className="mt-3 overflow-hidden rounded-lg border border-success/20 bg-success/[0.04]">
          <View className="flex-row items-center justify-between px-3 py-2.5">
            <View className="flex-row items-center gap-2.5 flex-1">
              <Ionicons name="document-text-outline" size={17} color="#34C759" />
              <View className="flex-1">
                <Text className="text-xs font-bold text-text">{t('gstBusinessInvoiceEnabled')}</Text>
                <Text className="text-[10px] text-text-secondary">{t('gstBusinessInvoiceEligible')}</Text>
              </View>
            </View>
            <VerifiedBadge variant="verified" compact />
          </View>
        </Animated.View>
      ) : null}

      <View className="my-3 h-px bg-border" />

      {showStrikethrough ? (
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-xs text-text-muted line-through">{t('totalBeforeGstDiscount')}</Text>
          <Text className="text-sm text-text-muted line-through">{formatINR(preDiscountTotal!)}</Text>
        </View>
      ) : null}

      <View className="flex-row justify-between items-center">
        <Text className="font-bold text-text">{t('grandTotal')}</Text>
        <Text className="text-xl font-bold text-primary">{formatINR(checkoutTotal)}</Text>
      </View>

      {hasGstDiscount ? (
        <Animated.View
          entering={FadeInDown.duration(250).delay(100)}
          className="mt-2 flex-row items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
          <Ionicons name="sparkles" size={14} color="#34C759" />
          <Text className="text-xs font-semibold text-success flex-1">
            {t('youAreSaving')} {formatINR(gstBusinessDiscount)} {t('withVerifiedGstPricing')}
          </Text>
        </Animated.View>
      ) : null}

      {corporateSavings > 0 && (
        <View className="mt-2 flex-row items-center gap-2 rounded-lg bg-success/10 p-3">
          <Ionicons name="checkmark-circle" size={16} color="#388E3C" />
          <Text className="text-xs font-medium text-success">
            {t('youAreSaving')} {formatINR(corporateSavings)}
          </Text>
        </View>
      )}
    </View>
  );
}
