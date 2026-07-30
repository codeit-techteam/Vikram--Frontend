import { memo, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { MaterialCategoryCard } from '@components/home/MaterialCategoryCard';
import {
  CATEGORY_GRID_GAP,
  CATEGORY_GRID_PADDING,
  getCategoryGridColumns,
} from '@components/home/categoryGridLayout';
import type { CatalogCategory } from '@/types/catalog';

interface MaterialCategoriesGridProps {
  categories: CatalogCategory[];
  language: string;
  onCategoryPress: (category: CatalogCategory) => void;
}

function categoryLabel(cat: CatalogCategory, language: string): string {
  return language === 'hi' && cat.nameHi ? cat.nameHi : cat.name;
}

/**
 * Responsive vertical category grid for Home.
 * Uses row Views (not FlatList) so it can sit inside the parent ScrollView
 * without nested VirtualizedList warnings.
 */
function MaterialCategoriesGridComponent({
  categories,
  language,
  onCategoryPress,
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
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((cat, colIndex) => {
            const index = rowIndex * numColumns + colIndex;
            return (
              <MaterialCategoryCard
                key={cat.id}
                label={categoryLabel(cat, language)}
                image={cat.image as number | { uri: string }}
                productCount={cat.productCount}
                fadeDelay={Math.min(index * 35, 280)}
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
    paddingHorizontal: CATEGORY_GRID_PADDING,
    gap: CATEGORY_GRID_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: CATEGORY_GRID_GAP,
  },
  spacer: {
    flex: 1,
  },
});
