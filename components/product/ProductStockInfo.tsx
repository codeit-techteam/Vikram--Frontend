import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { useTranslation } from '@store/languageStore';

interface ProductStockInfoProps {
  stockLeft: number | null;
  /** Optional. When omitted, ETA is hidden. */
  deliveryEta?: string;
  /** Card list: one horizontal meta row. Detail: stacked. */
  variant?: 'row' | 'stack';
  compact?: boolean;
  vehicleIcon?: 'bicycle-outline' | 'car-outline' | 'bus-outline' | 'trail-sign-outline';
}

function displayEtaText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (/^(estimated delivery|delivery estimate|updating delivery)/i.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

export function ProductStockInfo({
  stockLeft,
  deliveryEta = '',
  variant = 'stack',
  compact = false,
  vehicleIcon = 'bus-outline',
}: ProductStockInfoProps) {
  const { t } = useTranslation();
  const etaText = displayEtaText(deliveryEta);

  if (variant === 'row') {
    return (
      <View style={styles.row}>
        {stockLeft !== null ? (
          <Text style={styles.stockInline} numberOfLines={1}>
            {t('onlyXLeft').replace('{count}', String(stockLeft))}
          </Text>
        ) : null}
        {stockLeft !== null && etaText ? <Text style={styles.dot}>·</Text> : null}
        {etaText ? (
          <>
            <Ionicons name={vehicleIcon} size={12} color="#2E7D32" />
            <Text style={styles.etaInline} numberOfLines={1}>
              {etaText}
            </Text>
          </>
        ) : null}
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
      {etaText ? (
        <Animated.View
          key={etaText}
          entering={FadeIn.duration(250)}
          style={styles.deliveryRow}
        >
          <Ionicons name={vehicleIcon} size={compact ? 13 : 15} color="#2E7D32" />
          <Text style={[styles.deliveryEta, compact && styles.deliveryEtaCompact]}>
            {etaText}
          </Text>
        </Animated.View>
      ) : null}
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
  deliveryEta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
  deliveryEtaCompact: {
    fontSize: 11,
  },
});
