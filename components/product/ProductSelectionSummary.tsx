import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { formatINR } from '@utils/formatCurrency';

interface ProductSelectionSummaryProps {
  productName: string;
  variantLabel?: string;
  quantity: number;
  unit: string;
  total: number;
}

export function ProductSelectionSummary({
  productName,
  variantLabel,
  quantity,
  unit,
  total,
}: ProductSelectionSummaryProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(300).springify().damping(18)}
      className="mt-4 rounded-card border border-border bg-trust p-4">
      <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
        Order Summary
      </Text>
      <SummaryRow label="Product" value={productName} />
      {variantLabel ? <SummaryRow label="Variant" value={variantLabel} /> : null}
      <SummaryRow label="Quantity" value={String(quantity)} />
      <SummaryRow label="Unit" value={unit} />
      <View className="mt-2 border-t border-border pt-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-bold text-text">Total</Text>
          <Text className="text-xl font-extrabold text-primary">{formatINR(total, false)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-1.5 flex-row justify-between gap-3">
      <Text className="text-sm text-text-secondary">{label}</Text>
      <Text className="flex-1 text-right text-sm font-semibold text-text">{value}</Text>
    </View>
  );
}
