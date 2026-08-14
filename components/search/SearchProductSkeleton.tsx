import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ShimmerPlaceholder } from '@components/ui/ShimmerPlaceholder';

function SearchProductSkeletonComponent() {
  return (
    <View style={styles.card}>
      <ShimmerPlaceholder style={styles.image} />
      <View style={styles.body}>
        <ShimmerPlaceholder style={styles.title} />
        <ShimmerPlaceholder style={styles.meta} />
        <ShimmerPlaceholder style={styles.price} />
        <ShimmerPlaceholder style={styles.eta} />
        <View style={styles.footer}>
          <ShimmerPlaceholder style={styles.stock} />
          <ShimmerPlaceholder style={styles.add} />
        </View>
      </View>
    </View>
  );
}

export function SearchProductSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SearchProductSkeletonComponent key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  body: {
    flex: 1,
    gap: 8,
  },
  title: {
    height: 16,
    width: '88%',
    borderRadius: 4,
  },
  meta: {
    height: 12,
    width: '55%',
    borderRadius: 4,
  },
  price: {
    height: 16,
    width: '42%',
    borderRadius: 4,
  },
  eta: {
    height: 12,
    width: '70%',
    borderRadius: 4,
  },
  footer: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stock: {
    height: 12,
    width: 72,
    borderRadius: 4,
  },
  add: {
    height: 34,
    width: 72,
    borderRadius: 10,
  },
});

export const SearchProductSkeleton = memo(SearchProductSkeletonComponent);
