import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, type ImageSourcePropType, type ViewToken } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

import { CustomerReviewCard } from '@components/home/CustomerReviewCard';
import { CustomerVideoCard } from '@components/testimonial/CustomerVideoCard';
import {
  REVIEW_CARD_SNAP,
  TESTIMONIAL_CARD_GAP,
  TESTIMONIAL_VIDEO_SNAP,
} from '@components/testimonial/constants';
import { FullscreenImageViewer } from '@components/testimonial/FullscreenImageViewer';
import { FullscreenVideoPlayer } from '@components/testimonial/FullscreenVideoPlayer';
import {
  TESTIMONIAL_REVIEWS,
  TESTIMONIAL_VIDEOS,
  type TestimonialReview,
  type TestimonialVideo,
} from '@constants/testimonialData';
import { useCarouselDrawerLock } from '@hooks/useCarouselDrawerLock';
import { useTranslation } from '@store/languageStore';
import { getVideoThumbnailUri } from '@utils/videoThumbnailCache';

const H_PAD = 16;
const VIDEO_VIEWABILITY = { itemVisiblePercentThreshold: 55 };

interface TestimonialCarouselProps {
  /** Called while horizontal lists are being scrolled — use to pause drawer swipe. */
  onHorizontalInteractionChange?: (isInteracting: boolean) => void;
}

export function TestimonialCarousel({
  onHorizontalInteractionChange,
}: TestimonialCarouselProps) {
  const { t } = useTranslation();
  const [visibleVideoId, setVisibleVideoId] = useState(TESTIMONIAL_VIDEOS[0]?.id ?? '');
  const [activeVideo, setActiveVideo] = useState<TestimonialVideo | null>(null);
  const [activePhoto, setActivePhoto] = useState<ImageSourcePropType | null>(null);
  const interactingCount = useRef(0);

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
    const first = TESTIMONIAL_VIDEOS[0];
    if (first) {
      void getVideoThumbnailUri(first.video).catch(() => undefined);
    }
  }, []);

  const onVideoViewableChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken<TestimonialVideo>[] }) => {
      const primary = viewableItems.find((entry) => entry.isViewable)?.item;
      if (primary) setVisibleVideoId(primary.id);
    },
  ).current;

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

  const videoListProps = {
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
  };

  const reviewListProps = {
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
  };

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('customerTestimonials')}</Text>
        <Text style={styles.subtitle}>{t('customerTestimonialsSubtitle')}</Text>
      </View>

      <FlatList
        {...videoListProps}
        data={TESTIMONIAL_VIDEOS}
        contentContainerStyle={styles.videoRow}
        keyExtractor={videoKeyExtractor}
        renderItem={renderVideo}
        ItemSeparatorComponent={videoSeparator}
        onViewableItemsChanged={onVideoViewableChanged}
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

      <FlatList
        {...reviewListProps}
        data={TESTIMONIAL_REVIEWS}
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
    gap: 16,
  },
  header: {
    paddingHorizontal: H_PAD,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
    marginTop: 4,
    lineHeight: 18,
  },
  videoRow: {
    paddingHorizontal: H_PAD,
    paddingBottom: 4,
  },
  reviewRow: {
    paddingHorizontal: H_PAD,
    paddingBottom: 4,
  },
  separator: {
    width: TESTIMONIAL_CARD_GAP,
  },
});
