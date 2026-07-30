import { memo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';

import { ShimmerPlaceholder } from '@components/ui/ShimmerPlaceholder';
import { getProductGridCardWidth } from '@components/product/productGridLayout';

function ProductGridCardSkeletonComponent() {
  const { width } = useWindowDimensions();
  const cardWidth = getProductGridCardWidth(width);

  return (
    <View style={[styles.card, { width: cardWidth }]}>
      <View style={styles.imageWrap}>
        <ShimmerPlaceholder style={StyleSheet.absoluteFill} />

        <ShimmerPlaceholder style={styles.brandBadge} />

        <ShimmerPlaceholder style={styles.addBtn} />
      </View>

      <ShimmerPlaceholder style={styles.bulkBadge} />

      <View style={styles.body}>
        <View style={styles.priceRow}>
          <ShimmerPlaceholder style={styles.price} />
          <ShimmerPlaceholder style={styles.unit} />
          <ShimmerPlaceholder style={styles.mrp} />
        </View>
        <ShimmerPlaceholder style={styles.off} />
        <ShimmerPlaceholder style={styles.nameLine} />
        <ShimmerPlaceholder style={styles.nameLineShort} />
        <ShimmerPlaceholder style={styles.stock} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
  },
  imageWrap: {
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#F7F7F7',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  brandBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 44,
    height: 16,
    borderRadius: 4,
  },
  addBtn: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 52,
    height: 30,
    borderRadius: 8,
  },
  bulkBadge: {
    marginTop: 6,
    height: 22,
    borderRadius: 6,
    width: '100%',
  },
  body: {
    marginTop: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  price: {
    width: 52,
    height: 18,
    borderRadius: 4,
  },
  unit: {
    width: 28,
    height: 12,
    borderRadius: 4,
  },
  mrp: {
    width: 40,
    height: 12,
    borderRadius: 4,
    marginLeft: 2,
  },
  off: {
    marginTop: 2,
    width: 56,
    height: 12,
    borderRadius: 4,
  },
  nameLine: {
    marginTop: 4,
    width: '92%',
    height: 13,
    borderRadius: 4,
  },
  nameLineShort: {
    marginTop: 4,
    width: '68%',
    height: 13,
    borderRadius: 4,
  },
  stock: {
    marginTop: 4,
    width: 48,
    height: 11,
    borderRadius: 4,
  },
});

export const ProductGridCardSkeleton = memo(ProductGridCardSkeletonComponent);
