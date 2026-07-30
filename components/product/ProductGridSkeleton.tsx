import { memo, useMemo } from 'react';
import { FlatList, StyleSheet } from 'react-native';

import { ProductGridCardSkeleton } from '@components/product/ProductGridCardSkeleton';
import {
  PRODUCT_GRID_GAP,
  PRODUCT_GRID_PADDING,
} from '@components/product/productGridLayout';

const SKELETON_COUNT = 9;

function ProductGridSkeletonComponent() {
  const data = useMemo(
    () => Array.from({ length: SKELETON_COUNT }, (_, i) => ({ id: `product-skeleton-${i}` })),
    [],
  );

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      numColumns={2}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={styles.content}
      renderItem={() => <ProductGridCardSkeleton />}
    />
  );
}

const styles = StyleSheet.create({
  columnWrapper: {
    paddingHorizontal: PRODUCT_GRID_PADDING,
    gap: PRODUCT_GRID_GAP,
  },
  content: {
    paddingBottom: 40,
  },
});

export const ProductGridSkeleton = memo(ProductGridSkeletonComponent);
