import { memo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { TESTIMONIAL_CARD_WIDTH } from '@components/testimonial/constants';
import { useVideoThumbnail } from '@hooks/useVideoThumbnail';
import type { TestimonialVideo } from '@constants/testimonialData';

interface CustomerVideoCardProps {
  item: TestimonialVideo;
  isVisible: boolean;
  onPlay: (item: TestimonialVideo) => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={styles.stars}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < rating ? 'star' : 'star-outline'}
          size={12}
          color="#FEB623"
        />
      ))}
    </View>
  );
}

export const CustomerVideoCard = memo(function CustomerVideoCard({
  item,
  isVisible,
  onPlay,
}: CustomerVideoCardProps) {
  const { thumbnailUri, isLoading, error, retry } = useVideoThumbnail(
    item.videoModule ?? (typeof item.video === 'number' ? item.video : null),
    isVisible,
  );

  const handlePlay = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlay(item);
  };

  const posterSource = thumbnailUri ? { uri: thumbnailUri } : item.thumbnail;

  return (
    <View style={styles.card}>
      <View style={styles.mediaWrap}>
        <Image
          source={posterSource}
          style={styles.poster}
          contentFit="cover"
          transition={200}
          placeholder={item.thumbnail}
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          style={styles.mediaGradient}
          pointerEvents="none"
        />

        {isLoading && isVisible && !thumbnailUri ? (
          <View style={styles.thumbLoader}>
            <ActivityIndicator size="small" color="#FEB623" />
          </View>
        ) : null}

        {error && !thumbnailUri ? (
          <Pressable style={styles.thumbError} onPress={retry}>
            <Ionicons name="refresh-outline" size={16} color="#FFFFFF" />
            <Text style={styles.thumbErrorText}>Tap to load preview</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={styles.playOverlay}
          onPress={() => void handlePlay()}
          accessibilityRole="button"
          accessibilityLabel={`Play testimonial from ${item.customerName}`}>
          <View style={styles.playButton}>
            <Ionicons name="play" size={30} color="#1A1A1A" style={styles.playIcon} />
          </View>
        </Pressable>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{item.customerName}</Text>
          <StarRating rating={item.rating} />
        </View>
        <Text style={styles.location}>{item.location}</Text>
        <Text style={styles.quote} numberOfLines={2}>
          &ldquo;{item.quote}&rdquo;
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: TESTIMONIAL_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  mediaWrap: {
    height: 180,
    backgroundColor: '#2A3444',
    position: 'relative',
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  mediaGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  thumbLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26, 35, 50, 0.35)',
  },
  thumbError: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  thumbErrorText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(254, 182, 35, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  playIcon: {
    marginLeft: 4,
  },
  info: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    flex: 1,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  location: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  quote: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 19,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
