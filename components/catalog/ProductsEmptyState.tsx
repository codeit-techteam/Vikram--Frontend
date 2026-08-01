import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';

interface ProductsEmptyStateProps {
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
}

export function ProductsEmptyState({
  hasActiveFilters = false,
  onResetFilters,
}: ProductsEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        <Ionicons name="cube-outline" size={48} color="#FEB623" />
      </View>
      <Text style={styles.title}>
        {hasActiveFilters ? 'No Products Found' : t('noProductsFound')}
      </Text>
      {hasActiveFilters ? (
        <>
          <Text style={styles.subtitle}>Try removing filters</Text>
          {onResetFilters ? (
            <ScaledPressable onPress={onResetFilters} style={styles.resetButton} scaleTo={0.97}>
              <Text style={styles.resetText}>Reset Filters</Text>
            </ScaledPressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  resetButton: {
    marginTop: 16,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FEB623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
