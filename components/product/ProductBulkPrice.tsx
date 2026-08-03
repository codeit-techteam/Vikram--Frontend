import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@store/languageStore';
import { formatINR } from '@utils/formatCurrency';
import type { ProductPricing } from '@utils/productPricing';

interface ProductBulkPriceProps {
  pricing: ProductPricing;
  /** Card list: single-line chip. Detail: full box. */
  variant?: 'inline' | 'box';
  compact?: boolean;
}

/** Informational bulk pricing — never replaces the primary selling price. */
export function ProductBulkPrice({
  pricing,
  variant = 'box',
  compact = false,
}: ProductBulkPriceProps) {
  const { t } = useTranslation();

  if (!pricing.hasBulk) return null;

  const savePerUnit = Math.max(0, pricing.sellingPrice - pricing.bulkPrice);
  const tierLabel =
    pricing.bulkLabel ||
    `Bulk Price (${pricing.bulkThreshold}+)`;

  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        <Text style={styles.inlineLabel} numberOfLines={1}>
          {tierLabel} {formatINR(pricing.bulkPrice, false)}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={[styles.title, compact && styles.titleCompact]}>
        {t('bulkPricingTitle')}
      </Text>
      <Text style={[styles.threshold, compact && styles.thresholdCompact]}>
        {tierLabel} · {formatINR(pricing.bulkPrice, false)}/{pricing.unit}
      </Text>
      {savePerUnit > 0 ? (
        <Text style={[styles.save, compact && styles.saveCompact]}>
          Save {formatINR(savePerUnit, false)} per {pricing.unit.toLowerCase()}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  inlineLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.2,
  },
  card: {
    marginTop: 10,
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#A5D6A7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  cardCompact: {
    marginTop: 6,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: 9,
  },
  threshold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  thresholdCompact: {
    fontSize: 11,
  },
  save: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: '600',
    color: '#1B5E20',
  },
  saveCompact: {
    fontSize: 10,
  },
});
