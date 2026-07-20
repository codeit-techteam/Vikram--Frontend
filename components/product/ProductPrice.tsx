import { StyleSheet, Text, View } from 'react-native';

import { formatINR } from '@utils/formatCurrency';
import { ProductUnit } from '@components/product/ProductUnit';
import type { ProductPricing } from '@utils/productPricing';

const DARK = '#1A1A1A';

interface ProductPriceProps {
  pricing: ProductPricing;
  size?: 'sm' | 'lg';
  showUnit?: boolean;
}

export function ProductPrice({ pricing, size = 'sm', showUnit = false }: ProductPriceProps) {
  const isLg = size === 'lg';

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.selling, isLg && styles.sellingLg]}>
          {formatINR(pricing.sellingPrice, false)}
          {showUnit ? <ProductUnit unit={pricing.unit} variant="price" style={isLg ? styles.unitLg : styles.unit} /> : null}
        </Text>
        {pricing.discountPercent > 0 ? (
          <>
            <Text style={[styles.original, isLg && styles.originalLg]}>
              {formatINR(pricing.originalPrice, false)}
            </Text>
            <Text style={[styles.discount, isLg && styles.discountLg]}>
              {pricing.discountPercent}% OFF
            </Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  selling: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
  },
  sellingLg: {
    fontSize: 24,
  },
  unit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  unitLg: {
    fontSize: 14,
  },
  original: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  originalLg: {
    fontSize: 14,
  },
  discount: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2E7D32',
  },
  discountLg: {
    fontSize: 13,
  },
});
