import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from '@store/languageStore';

interface ProductStockInfoProps {
  stockLeft: number | null;
  deliveryEta: string;
  /** Card list: one horizontal meta row. Detail: stacked. */
  variant?: 'row' | 'stack';
  compact?: boolean;
}

export function ProductStockInfo({
  stockLeft,
  deliveryEta,
  variant = 'stack',
  compact = false,
}: ProductStockInfoProps) {
  const { t } = useTranslation();

  if (variant === 'row') {
    return (
      <View style={styles.row}>
        {stockLeft !== null ? (
          <Text style={styles.stockInline} numberOfLines={1}>
            {t('onlyXLeft').replace('{count}', String(stockLeft))}
          </Text>
        ) : null}
        {stockLeft !== null ? <Text style={styles.dot}>·</Text> : null}
        <Ionicons name="bicycle-outline" size={12} color="#2E7D32" />
        <Text style={styles.etaInline} numberOfLines={1}>
          {deliveryEta}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {stockLeft !== null ? (
        <Text style={[styles.stock, compact && styles.stockCompact]}>
          {t('onlyXLeft').replace('{count}', String(stockLeft))}
        </Text>
      ) : null}
      <View style={styles.deliveryRow}>
        <Ionicons name="bicycle-outline" size={compact ? 13 : 15} color="#2E7D32" />
        <Text style={[styles.deliveryLabel, compact && styles.deliveryLabelCompact]}>
          {t('deliveryEtaLabel')}
        </Text>
        <Text style={[styles.deliveryEta, compact && styles.deliveryEtaCompact]}>{deliveryEta}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  stockInline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E65100',
  },
  dot: {
    fontSize: 10,
    color: '#CCC',
  },
  etaInline: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2E7D32',
  },
  wrap: {
    gap: 4,
    marginTop: 4,
  },
  wrapCompact: {
    gap: 2,
    marginTop: 2,
  },
  stock: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
  },
  stockCompact: {
    fontSize: 11,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deliveryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E7D32',
  },
  deliveryLabelCompact: {
    fontSize: 11,
  },
  deliveryEta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  deliveryEtaCompact: {
    fontSize: 11,
  },
});
