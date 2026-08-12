import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type ViewToken,
} from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { CustomerReviewCard } from '@components/home/CustomerReviewCard';
import { CustomerVideoCard } from '@components/testimonial/CustomerVideoCard';
import {
  REVIEW_CARD_SNAP,
  TESTIMONIAL_CARD_GAP,
  TESTIMONIAL_VIDEO_SNAP,
} from '@components/testimonial/constants';
import { FullscreenImageViewer } from '@components/testimonial/FullscreenImageViewer';
import { FullscreenVideoPlayer } from '@components/testimonial/FullscreenVideoPlayer';
import type { TestimonialReview, TestimonialVideo } from '@constants/testimonialData';
import { useCarouselDrawerLock } from '@hooks/useCarouselDrawerLock';
import { useTranslation } from '@store/languageStore';
import { prefetchVideoThumbnail } from '@utils/videoThumbnailCache';
import { extractVideoUri } from '@utils/cmsMedia';

const H_PAD = 16;
const GOLD = '#FEB623';
const VIDEO_VIEWABILITY = { itemVisiblePercentThreshold: 55 };

interface TestimonialCarouselProps {
  /** Called while horizontal lists are being scrolled — use to pause drawer swipe. */
  onHorizontalInteractionChange?: (isInteracting: boolean) => void;
  videos?: TestimonialVideo[];
  reviews?: TestimonialReview[];
  title?: string | null;
  subtitle?: string | null;
}

export function TestimonialCarousel({
  onHorizontalInteractionChange,
  videos = [],
  reviews = [],
  title,
  subtitle,
}: TestimonialCarouselProps) {
  const { t } = useTranslation();
  const [visibleVideoId, setVisibleVideoId] = useState(videos[0]?.id ?? '');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [activeVideo, setActiveVideo] = useState<TestimonialVideo | null>(null);
  const [activePhoto, setActivePhoto] = useState<ImageSourcePropType | null>(null);
  const interactingCount = useRef(0);

  const sectionTitle = title ?? t('customerTestimonials');
  const sectionSubtitle = subtitle ?? t('customerTestimonialsSubtitle');

  useEffect(() => {
    if (videos[0]?.id) {
      setVisibleVideoId(videos[0].id);
      setActiveVideoIndex(0);
    }
  }, [videos]);

  const notifyInteraction = useCallback(
    (active: boolean) => {
      if (active) {
        interactingCount.current += 1;
        onHorizontalInteractionChange?.(true);
        return;
      }

      interactingCount.current = Math.max(0, interactingCount.current - 1);
      if (interactingCount.current === 0) {
        onHorizontalInteractionChange?.(false);
      }
    },
    [onHorizontalInteractionChange],
  );

  const videoScrollLock = useCarouselDrawerLock(notifyInteraction);
  const reviewScrollLock = useCarouselDrawerLock(notifyInteraction);

  useEffect(() => {
    for (const video of videos.slice(0, 3)) {
      const moduleId =
        video.videoModule ?? (typeof video.video === 'number' ? video.video : null);
      if (typeof moduleId === 'number') {
        prefetchVideoThumbnail(moduleId);
        continue;
      }
      const uri = video.videoUri ?? extractVideoUri(video.video);
      prefetchVideoThumbnail(uri);
    }
  }, [videos]);

  const onVideoViewableChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<TestimonialVideo>[] }) => {
      const primary = viewableItems.find((entry) => entry.isViewable)?.item;
      if (primary) setVisibleVideoId(primary.id);
    },
  ).current;

  const onVideoScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const nextIndex = Math.round(offsetX / TESTIMONIAL_VIDEO_SNAP);
      const clamped = Math.max(0, Math.min(videos.length - 1, nextIndex));
      setActiveVideoIndex((prev) => (prev === clamped ? prev : clamped));
    },
    [videos.length],
  );

  const handlePlay = useCallback((item: TestimonialVideo) => {
    setActiveVideo(item);
  }, []);

  const handleClosePlayer = useCallback(() => {
    setActiveVideo(null);
  }, []);

  const handlePhotoPress = useCallback((item: TestimonialReview) => {
    if (item.photo) setActivePhoto(item.photo);
  }, []);

  const handleClosePhoto = useCallback(() => {
    setActivePhoto(null);
  }, []);

  const renderVideo = useCallback(
    ({ item }: { item: TestimonialVideo }) => (
      <CustomerVideoCard
        item={item}
        isVisible={visibleVideoId === item.id}
        onPlay={handlePlay}
      />
    ),
    [visibleVideoId, handlePlay],
  );

  const renderReview = useCallback(
    ({ item }: { item: TestimonialReview }) => (
      <CustomerReviewCard item={item} onPhotoPress={handlePhotoPress} />
    ),
    [handlePhotoPress],
  );

  const videoKeyExtractor = useCallback((item: TestimonialVideo) => item.id, []);
  const reviewKeyExtractor = useCallback((item: TestimonialReview) => item.id, []);

  const videoSeparator = useCallback(() => <View style={styles.separator} />, []);
  const reviewSeparator = useCallback(() => <View style={styles.separator} />, []);

  const videoListProps = useMemo(
    () => ({
      horizontal: true as const,
      nestedScrollEnabled: true,
      showsHorizontalScrollIndicator: false,
      decelerationRate: 'fast' as const,
      snapToInterval: TESTIMONIAL_VIDEO_SNAP,
      snapToAlignment: 'start' as const,
      disableIntervalMomentum: true,
      directionalLockEnabled: true,
      scrollEventThrottle: 16,
      overScrollMode: 'never' as const,
      bounces: true,
      removeClippedSubviews: true,
    }),
    [],
  );

  const reviewListProps = useMemo(
    () => ({
      horizontal: true as const,
      nestedScrollEnabled: true,
      showsHorizontalScrollIndicator: false,
      decelerationRate: 'fast' as const,
      snapToInterval: REVIEW_CARD_SNAP,
      snapToAlignment: 'start' as const,
      disableIntervalMomentum: true,
      directionalLockEnabled: true,
      scrollEventThrottle: 16,
      overScrollMode: 'never' as const,
      bounces: true,
      removeClippedSubviews: true,
    }),
    [],
  );

  if (videos.length === 0 && reviews.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>{sectionTitle}</Text>
          {videos.length + reviews.length > 0 ? (
            <View style={styles.trustChip}>
              <Ionicons name="star" size={11} color={GOLD} />
              <Text style={styles.trustChipText}>{t('verifiedReviews')}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.subtitle}>{sectionSubtitle}</Text>
      </View>

      {videos.length > 0 ? (
        <View style={styles.videoBlock}>
          <FlatList
            {...videoListProps}
            data={videos}
            contentContainerStyle={styles.videoRow}
            keyExtractor={videoKeyExtractor}
            renderItem={renderVideo}
            ItemSeparatorComponent={videoSeparator}
            onViewableItemsChanged={onVideoViewableChanged}
            onScroll={onVideoScroll}
            viewabilityConfig={VIDEO_VIEWABILITY}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={3}
            getItemLayout={(_, index) => ({
              length: TESTIMONIAL_VIDEO_SNAP,
              offset: TESTIMONIAL_VIDEO_SNAP * index,
              index,
            })}
            {...videoScrollLock}
          />

          {videos.length > 1 ? (
            <View style={styles.dots} accessibilityRole="adjustable">
              {videos.map((video, index) => (
                <View
                  key={video.id}
                  style={[styles.dot, index === activeVideoIndex && styles.dotActive]}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {reviews.length > 0 ? (
        <View style={styles.reviewBlock}>
          {videos.length > 0 ? (
            <Text style={styles.reviewLabel}>{t('writtenReviews')}</Text>
          ) : null}
          <FlatList
            {...reviewListProps}
            data={reviews}
            contentContainerStyle={styles.reviewRow}
            keyExtractor={reviewKeyExtractor}
            renderItem={renderReview}
            ItemSeparatorComponent={reviewSeparator}
            initialNumToRender={2}
            maxToRenderPerBatch={3}
            windowSize={4}
            getItemLayout={(_, index) => ({
              length: REVIEW_CARD_SNAP,
              offset: REVIEW_CARD_SNAP * index,
              index,
            })}
            {...reviewScrollLock}
          />
        </View>
      ) : null}

      {activeVideo ? (
        <FullscreenVideoPlayer item={activeVideo} visible onClose={handleClosePlayer} />
      ) : null}

      {activePhoto ? (
        <FullscreenImageViewer
          source={activePhoto}
          visible
          onClose={handleClosePhoto}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 14,
  },
  header: {
    paddingHorizontal: H_PAD,
    gap: 6,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  trustChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF8E7',
    borderWidth: 1,
    borderColor: 'rgba(254, 182, 35, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  trustChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 19,
  },
  videoBlock: {
    gap: 10,
  },
  videoRow: {
    paddingHorizontal: H_PAD,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    width: 18,
    backgroundColor: GOLD,
  },
  reviewBlock: {
    gap: 10,
  },
  reviewLabel: {
    paddingHorizontal: H_PAD,
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: -0.1,
  },
  reviewRow: {
    paddingHorizontal: H_PAD,
    paddingBottom: 2,
  },
  separator: {
    width: TESTIMONIAL_CARD_GAP,
  },
});
