import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { borderRadius, theme } from '@constants/theme';

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

export function OrderFilterSkeleton() {
  return (
    <View style={styles.filterRow}>
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonBlock key={i} style={styles.chip} delay={i * 60} />
      ))}
    </View>
  );
}

export function OrderCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <SkeletonBlock style={styles.metaLine} delay={delay} />
        <SkeletonBlock style={styles.badge} delay={delay + 40} />
      </View>
      <SkeletonBlock style={styles.statusLine} delay={delay + 80} />
      <SkeletonBlock style={styles.subLine} delay={delay + 120} />
      <View style={styles.productRow}>
        <SkeletonBlock style={styles.thumb} delay={delay + 160} />
        <View style={styles.productText}>
          <SkeletonBlock style={styles.productName} delay={delay + 200} />
          <SkeletonBlock style={styles.productVariant} delay={delay + 240} />
        </View>
      </View>
      <View style={styles.footer}>
        <SkeletonBlock style={styles.footerLine} delay={delay + 280} />
        <SkeletonBlock style={styles.cta} delay={delay + 320} />
      </View>
    </View>
  );
}

export function OrdersListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.list}>
      <OrderFilterSkeleton />
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} delay={i * 100} />
      ))}
    </View>
  );
}

export function OrderDetailSkeleton() {
  return (
    <View style={styles.detail}>
      <SkeletonBlock style={styles.detailHero} />
      <SkeletonBlock style={styles.detailSection} delay={80} />
      <SkeletonBlock style={styles.detailSection} delay={160} />
      <SkeletonBlock style={styles.detailSection} delay={240} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: theme.lightGray,
    borderRadius: borderRadius.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: theme.white,
  },
  chip: {
    width: 88,
    height: 34,
    borderRadius: borderRadius.full,
  },
  list: {
    flex: 1,
    backgroundColor: theme.bgMain,
  },
  card: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderRadius: borderRadius.xl,
    backgroundColor: theme.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  metaLine: { width: '55%', height: 12 },
  badge: { width: 72, height: 24, borderRadius: borderRadius.full },
  statusLine: { width: '45%', height: 18, marginBottom: 8 },
  subLine: { width: '35%', height: 12, marginBottom: 16 },
  productRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  thumb: { width: 56, height: 56, borderRadius: borderRadius.md },
  productText: { flex: 1, gap: 8 },
  productName: { width: '80%', height: 14 },
  productVariant: { width: '50%', height: 10 },
  footer: { gap: 10 },
  footerLine: { width: '40%', height: 12 },
  cta: { width: '100%', height: 40, borderRadius: borderRadius.lg },
  detail: { padding: 16, gap: 16 },
  detailHero: { width: '100%', height: 120, borderRadius: borderRadius.xl },
  detailSection: { width: '100%', height: 160, borderRadius: borderRadius.xl },
});
