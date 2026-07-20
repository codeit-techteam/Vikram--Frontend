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

  if (variant === 'inline') {
    return (
      <View style={styles.inline}>
        <Text style={styles.inlineLabel}>{t('bulkPricingTitle')}</Text>
        <Text style={styles.inlineValue} numberOfLines={1}>
          {pricing.bulkThreshold}+ · {formatINR(pricing.bulkPrice, false)}/{pricing.unit}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={[styles.title, compact && styles.titleCompact]}>{t('bulkPricingTitle')}</Text>
      <Text style={[styles.threshold, compact && styles.thresholdCompact]}>
        {pricing.bulkThreshold}+ {pricing.unit}
      </Text>
      <Text style={[styles.price, compact && styles.priceCompact]}>
        {formatINR(pricing.bulkPrice, false)} / {pricing.unit}
      </Text>
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
    color: '#B8860B',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  inlineValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  card: {
    marginTop: 10,
    backgroundColor: '#FFF8E8',
    borderWidth: 1,
    borderColor: '#F0E0B0',
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
    color: '#888',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  titleCompact: {
    fontSize: 9,
  },
  threshold: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  thresholdCompact: {
    fontSize: 11,
  },
  price: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  priceCompact: {
    fontSize: 12,
  },
});
