import { memo, useMemo } from 'react';
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
import { StarRating } from '@components/testimonial/StarRating';
import { useVideoThumbnail } from '@hooks/useVideoThumbnail';
import type { TestimonialVideo } from '@constants/testimonialData';
import { useTranslation } from '@store/languageStore';
import { extractVideoUri } from '@utils/cmsMedia';

const GOLD = '#FEB623';

interface CustomerVideoCardProps {
  item: TestimonialVideo;
  isVisible: boolean;
  onPlay: (item: TestimonialVideo) => void;
}

export const CustomerVideoCard = memo(function CustomerVideoCard({
  item,
  isVisible,
  onPlay,
}: CustomerVideoCardProps) {
  const { t } = useTranslation();

  // Always derive the card preview from the video itself — never a separate CMS thumbnail.
  const thumbSource = useMemo(() => {
    if (typeof item.videoModule === 'number') return item.videoModule;
    if (item.videoUri) return item.videoUri;
    return extractVideoUri(item.video);
  }, [item.video, item.videoModule, item.videoUri]);

  const { thumbnailUri, isLoading, error, retry } = useVideoThumbnail(
    thumbSource,
    isVisible,
    false,
  );

  const handlePlay = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlay(item);
  };

  return (
    <View style={styles.card}>
      <View style={styles.mediaWrap}>
        {thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={styles.poster}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.posterFallback}>
            <Ionicons name="videocam" size={36} color="rgba(255,255,255,0.35)" />
          </View>
        )}

        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'transparent', 'rgba(0,0,0,0.65)']}
          locations={[0, 0.45, 1]}
          style={styles.mediaGradient}
          pointerEvents="none"
        />

        {isLoading && isVisible && !thumbnailUri ? (
          <View style={styles.thumbLoader}>
            <ActivityIndicator size="small" color={GOLD} />
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
          <View style={styles.playRing}>
            <View style={styles.playButton}>
              <Ionicons name="play" size={26} color="#1A1A1A" style={styles.playIcon} />
            </View>
          </View>
        </Pressable>

        <View style={styles.durationBadge} pointerEvents="none">
          <Ionicons name="play" size={10} color="#1A1A1A" />
          <Text style={styles.durationText}>{t('videoTestimonial')}</Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {item.customerName}
            </Text>
            {item.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={11} color="#9CA3AF" />
                <Text style={styles.location} numberOfLines={1}>
                  {item.location}
                </Text>
              </View>
            ) : null}
          </View>
          <StarRating rating={item.rating} size={13} />
        </View>

        {item.quote ? (
          <View style={styles.quoteWrap}>
            <View style={styles.quoteAccent} />
            <Text style={styles.quote} numberOfLines={3}>
              &ldquo;{item.quote}&rdquo;
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: TESTIMONIAL_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  mediaWrap: {
    height: 210,
    backgroundColor: '#1F2937',
    position: 'relative',
  },
  poster: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
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
  playRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.45)',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 8,
  },
  playIcon: {
    marginLeft: 3,
  },
  durationBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: GOLD,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.2,
  },
  info: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
  },
  quoteWrap: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  quoteAccent: {
    width: 3,
    alignSelf: 'stretch',
    minHeight: 36,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginTop: 2,
  },
  quote: {
    flex: 1,
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 19,
    fontStyle: 'italic',
  },
});
