import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const GOLD = '#FEB623';

interface StarRatingProps {
  rating: number;
  size?: number;
}

export function StarRating({ rating, size = 12 }: StarRatingProps) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));

  return (
    <View style={styles.stars} accessibilityLabel={`${filled} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < filled ? 'star' : 'star-outline'}
          size={size}
          color={GOLD}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
