import { StyleSheet, Text, View } from 'react-native';

import { useTranslation } from '@store/languageStore';

interface ProductStockProps {
  stockLeft: number | null;
  deliveryEta: string;
  compact?: boolean;
}

/** Stock urgency + delivery ETA for product cards. */
export function ProductStock({ stockLeft, deliveryEta, compact = false }: ProductStockProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      {stockLeft !== null ? (
        <Text style={[styles.stock, compact && styles.stockCompact]}>
          {t('onlyXLeft').replace('{count}', String(stockLeft))}
        </Text>
      ) : null}
      <View style={styles.deliveryRow}>
        <Text style={styles.truck}>🚚</Text>
        <Text style={[styles.deliveryLabel, compact && styles.deliveryLabelCompact]}>
          {t('deliveryEtaLabel')}
        </Text>
        <Text style={[styles.deliveryEta, compact && styles.deliveryEtaCompact]}>
          {deliveryEta}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
    marginTop: 6,
  },
  wrapCompact: {
    marginTop: 4,
    gap: 3,
  },
  stock: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E65100',
    textTransform: 'capitalize',
  },
  stockCompact: {
    fontSize: 11,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  truck: {
    fontSize: 12,
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
