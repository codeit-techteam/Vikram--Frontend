import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from '@store/languageStore';
import { formatINR } from '@utils/formatCurrency';

interface PricingSummaryProps {
  unitLabel: string;
  baseRate: number;
  subtotal: number;
  gst: number;
  estimatedTotal: number;
}

function DottedRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View className="mb-2 flex-row items-center justify-between">
      <Text className="text-sm text-text-secondary">{label}</Text>
      <Text className="text-sm font-semibold" style={{ color: valueColor ?? '#1A1A1A' }}>
        {value}
      </Text>
    </View>
  );
}

export function PricingSummary({
  unitLabel,
  baseRate,
  subtotal,
  gst,
  estimatedTotal,
}: PricingSummaryProps) {
  const { t } = useTranslation();

  return (
    <View className="mx-5 mt-6 rounded-card border border-border bg-surface p-4 shadow-sm">
      <Text className="text-[10px] font-bold tracking-widest text-text-secondary">
        {t('pricingSummary')}
      </Text>

      <View className="mt-4">
        <DottedRow
          label={`${t('baseRate')} (per ${unitLabel.toLowerCase()})`}
          value={formatINR(baseRate)}
        />
        <DottedRow label={t('subtotal')} value={formatINR(subtotal)} />
        <DottedRow label={t('logistics')} value={t('free')} valueColor="#2E7D32" />
        <DottedRow label={t('gst18')} value={formatINR(gst)} />
      </View>

      <View className="my-4 h-px bg-border" />

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-[10px] font-bold tracking-wider text-primary">{t('estimatedTotal')}</Text>
          <Text className="mt-1 text-2xl font-bold text-text">{formatINR(estimatedTotal)}</Text>
        </View>
        <View className="rounded-full bg-primary px-3 py-1.5">
          <Text className="text-[10px] font-bold text-text-inverse">{t('quickQuote')}</Text>
        </View>
      </View>

      <View className="mt-4 flex-row items-start gap-2 rounded-lg bg-primary/10 p-3">
        <Ionicons name="information-circle-outline" size={16} color="#FF6B00" />
        <Text className="flex-1 text-xs leading-4 text-text-secondary">{t('pricesLocked')}</Text>
      </View>
    </View>
  );
}
