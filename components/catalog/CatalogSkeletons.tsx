import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function SkeletonBlock({
  style,
  delay = 0,
}: {
  style: ViewStyle;
  delay?: number;
}) {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withRepeat(
        withSequence(withTiming(1, { duration: 700 }), withTiming(0.45, { duration: 700 })),
        -1,
        false,
      );
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.block, style, animStyle]} />;
}

export function CategoryCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <View style={styles.categoryCard}>
      <SkeletonBlock style={styles.categoryImage} delay={delay} />
      <SkeletonBlock style={styles.categoryTitle} delay={delay + 40} />
      <SkeletonBlock style={styles.categoryMeta} delay={delay + 80} />
    </View>
  );
}

export function CategoriesGridSkeleton({ count = 6 }: { count?: number }) {
  const rows: number[][] = [];
  for (let i = 0; i < count; i += 2) {
    rows.push([i, i + 1].filter((n) => n < count));
  }
  return (
    <View style={styles.grid}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {row.map((i) => (
            <CategoryCardSkeleton key={i} delay={i * 60} />
          ))}
          {row.length === 1 ? <View style={styles.categoryCard} /> : null}
        </View>
      ))}
    </View>
  );
}

export function ProductCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <View style={styles.productCard}>
      <SkeletonBlock style={styles.productImage} delay={delay} />
      <View style={styles.productBody}>
        <SkeletonBlock style={styles.productBrand} delay={delay + 40} />
        <SkeletonBlock style={styles.productName} delay={delay + 80} />
        <SkeletonBlock style={styles.productPrice} delay={delay + 120} />
        <SkeletonBlock style={styles.productCta} delay={delay + 160} />
      </View>
    </View>
  );
}

export function ProductsListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} delay={i * 80} />
      ))}
    </View>
  );
}

export function ProductDetailSkeleton() {
  return (
    <View style={styles.detail}>
      <SkeletonBlock style={styles.detailHero} />
      <SkeletonBlock style={styles.detailTitle} delay={80} />
      <SkeletonBlock style={styles.detailLine} delay={120} />
      <SkeletonBlock style={styles.detailLineWide} delay={160} />
      <SkeletonBlock style={styles.detailBlock} delay={200} />
      <SkeletonBlock style={styles.detailBlock} delay={260} />
    </View>
  );
}

export function HomeCategoriesSkeleton() {
  return (
    <View style={styles.homeCats}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View key={i} style={styles.homeCatItem}>
          <SkeletonBlock style={styles.homeCatImage} delay={i * 50} />
          <SkeletonBlock style={styles.homeCatLabel} delay={i * 50 + 40} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: '#E8E8E8',
    borderRadius: 8,
  },
  grid: {
    paddingHorizontal: 20,
    gap: 0,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryCard: {
    flex: 1,
    marginBottom: 12,
  },
  categoryImage: {
    width: '100%',
    aspectRatio: 1.1,
    borderRadius: 16,
  },
  categoryTitle: {
    marginTop: 10,
    height: 14,
    width: '70%',
  },
  categoryMeta: {
    marginTop: 6,
    height: 10,
    width: '40%',
  },
  list: {
    padding: 16,
    gap: 14,
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#EBEBEB',
  },
  productImage: {
    width: 96,
    height: 96,
    borderRadius: 12,
  },
  productBody: {
    flex: 1,
    gap: 8,
    justifyContent: 'center',
  },
  productBrand: {
    height: 10,
    width: '30%',
  },
  productName: {
    height: 14,
    width: '80%',
  },
  productPrice: {
    height: 16,
    width: '45%',
  },
  productCta: {
    height: 36,
    width: '100%',
    borderRadius: 10,
  },
  detail: {
    padding: 16,
    gap: 12,
  },
  detailHero: {
    width: '100%',
    height: 260,
    borderRadius: 16,
  },
  detailTitle: {
    height: 24,
    width: '70%',
    marginTop: 8,
  },
  detailLine: {
    height: 12,
    width: '50%',
  },
  detailLineWide: {
    height: 12,
    width: '90%',
  },
  detailBlock: {
    height: 88,
    width: '100%',
    borderRadius: 14,
    marginTop: 8,
  },
  homeCats: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  homeCatItem: {
    alignItems: 'center',
    width: 80,
  },
  homeCatImage: {
    width: 72,
    height: 72,
    borderRadius: 16,
  },
  homeCatLabel: {
    marginTop: 8,
    height: 10,
    width: 56,
  },
});
