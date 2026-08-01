import { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { MaterialCategoryCard } from '@components/home/MaterialCategoryCard';
import {
  CATEGORY_GRID_GAP_H,
  CATEGORY_GRID_GAP_V,
  CATEGORY_GRID_PADDING,
  getCategoryGridColumns,
} from '@components/home/categoryGridLayout';
import type { CatalogCategory } from '@/types/catalog';
import { getCategoryDisplayName } from '@utils/categoryDisplay';

interface MaterialCategoriesGridProps {
  categories: CatalogCategory[];
  language: string;
  onCategoryPress: (category: CatalogCategory) => void;
  /** Optional outer horizontal padding override (default shared token). */
  paddingHorizontal?: number;
}

/**
 * Responsive vertical category grid for Home + Catalog.
 * Uses row Views (not FlatList) so it can sit inside the parent ScrollView
 * without nested VirtualizedList warnings.
 */
function MaterialCategoriesGridComponent({
  categories,
  language,
  onCategoryPress,
  paddingHorizontal = CATEGORY_GRID_PADDING,
}: MaterialCategoriesGridProps) {
  const { width } = useWindowDimensions();
  const numColumns = useMemo(() => getCategoryGridColumns(width), [width]);

  const rows = useMemo(() => {
    const result: CatalogCategory[][] = [];
    for (let i = 0; i < categories.length; i += numColumns) {
      result.push(categories.slice(i, i + numColumns));
    }
    return result;
  }, [categories, numColumns]);

  return (
    <View style={[styles.grid, { paddingHorizontal }]}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((cat, colIndex) => {
            const index = rowIndex * numColumns + colIndex;
            return (
              <MaterialCategoryCard
                key={cat.id}
                label={getCategoryDisplayName(cat, language)}
                image={cat.image as number | { uri: string }}
                fadeDelay={Math.min(index * 30, 240)}
                onPress={() => onCategoryPress(cat)}
              />
            );
          })}
          {/* Fill incomplete last row so card widths stay equal */}
          {row.length < numColumns
            ? Array.from({ length: numColumns - row.length }).map((_, i) => (
                <View key={`pad-${i}`} style={styles.spacer} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

export const MaterialCategoriesGrid = memo(MaterialCategoriesGridComponent);

const styles = StyleSheet.create({
  grid: {
    gap: CATEGORY_GRID_GAP_V,
  },
  row: {
    alignItems: 'stretch',
    flexDirection: 'row',
    gap: CATEGORY_GRID_GAP_H,
  },
  spacer: {
    flex: 1,
  },
});
