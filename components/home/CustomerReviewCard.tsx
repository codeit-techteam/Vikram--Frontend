import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import type { TestimonialReview } from '@constants/testimonialData';

interface CustomerReviewCardProps {
  item: TestimonialReview;
  onPhotoPress?: (item: TestimonialReview) => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <Text style={styles.stars}>
      {Array.from({ length: 5 })
        .map((_, i) => (i < rating ? '★' : '☆'))
        .join('')}
    </Text>
  );
}

export function CustomerReviewCard({ item, onPhotoPress }: CustomerReviewCardProps) {
  const initials = item.customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <View style={[styles.card, item.photo ? styles.cardWithPhoto : undefined]}>
      {item.photo ? (
        <ScaledPressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPhotoPress?.(item);
          }}
          style={styles.photoPressable}
          scaleTo={0.98}>
          <Image source={item.photo} style={styles.photo} contentFit="cover" />
        </ScaledPressable>
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
      )}
      <View style={item.photo ? styles.body : undefined}>
      <Text style={styles.name}>{item.customerName}</Text>
      <Text style={styles.businessType}>{item.businessType}</Text>
      <StarRating rating={item.rating} />
      <Text style={styles.review} numberOfLines={4}>
        &ldquo;{item.review}&rdquo;
      </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  cardWithPhoto: {
    padding: 0,
  },
  photoPressable: {
    width: '100%',
  },
  body: {
    padding: 16,
  },
  photo: {
    width: '100%',
    height: 110,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FEB623',
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  businessType: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
    marginBottom: 6,
  },
  stars: {
    fontSize: 12,
    color: '#FEB623',
    letterSpacing: 1,
    marginBottom: 8,
  },
  review: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
