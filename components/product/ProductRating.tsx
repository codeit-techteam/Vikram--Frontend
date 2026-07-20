import { StyleSheet, Text, View } from 'react-native';

const STAR = '★';
const STAR_EMPTY = '☆';
const GOLD = '#F5A623';

interface ProductRatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md';
}

function buildStars(rating: number): string {
  const filled = Math.min(5, Math.round(rating));
  return STAR.repeat(filled) + STAR_EMPTY.repeat(5 - filled);
}

export function ProductRating({ rating, reviewCount, size = 'sm' }: ProductRatingProps) {
  const isMd = size === 'md';

  return (
    <View style={styles.wrap}>
      <Text style={[styles.stars, isMd && styles.starsMd]}>{buildStars(rating)}</Text>
      <Text style={[styles.rating, isMd && styles.ratingMd]}>{rating.toFixed(1)}</Text>
      {reviewCount !== undefined ? (
        <Text style={[styles.count, isMd && styles.countMd]}>({reviewCount})</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  stars: {
    fontSize: 11,
    color: GOLD,
    letterSpacing: -0.5,
  },
  starsMd: {
    fontSize: 13,
  },
  rating: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  ratingMd: {
    fontSize: 13,
  },
  count: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  countMd: {
    fontSize: 12,
  },
});
