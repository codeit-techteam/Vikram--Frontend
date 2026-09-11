import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageSourcePropType,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { ScaledPressable } from '@components/ScaledPressable';
import { ExpoVideoPlayer } from '@components/video/ExpoVideoPlayer';
import type { ProductMediaItem } from '@types/catalog';
import { isProductVideoUrl, mediaSource } from '@utils/media';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type ProductGallerySlide =
  | { kind: 'IMAGE'; source: ImageSourcePropType; key: string }
  | {
      kind: 'VIDEO';
      url: string;
      posterSource?: ImageSourcePropType | null;
      key: string;
    };

interface ProductImageCarouselProps {
  /** Legacy image-only slides. */
  images?: ImageSourcePropType[];
  /** Preferred structured media slides (images + video). */
  media?: ProductMediaItem[];
  onMenuPress?: () => void;
}

function cleanMediaUrl(url: string): string {
  return url.split('?')[0]?.split('#')[0] || url;
}

function buildSlides(
  media: ProductMediaItem[] | undefined,
  images: ImageSourcePropType[] | undefined,
): ProductGallerySlide[] {
  if (media?.length) {
    return media
      .map((item, index) => {
        const isVideo =
          item.type === 'VIDEO' || isProductVideoUrl(item.url);
        if (isVideo) {
          return {
            kind: 'VIDEO' as const,
            url: cleanMediaUrl(item.url),
            posterSource: item.thumbnailUrl
              ? mediaSource(item.thumbnailUrl)
              : null,
            key: item.id || `video-${index}`,
          };
        }
        const source = mediaSource(item.url);
        if (!source) return null;
        return {
          kind: 'IMAGE' as const,
          source,
          key: item.id || `image-${index}`,
        };
      })
      .filter((item): item is ProductGallerySlide => Boolean(item));
  }

  return (images ?? []).map((source, index) => ({
    kind: 'IMAGE' as const,
    source,
    key: `legacy-${index}`,
  }));
}

function VideoSlidePreview({
  slide,
  width,
  height,
  posterUri,
  onPress,
}: {
  slide: Extract<ProductGallerySlide, { kind: 'VIDEO' }>;
  width: number;
  height: number;
  posterUri?: string | null;
  onPress: () => void;
}) {
  const poster =
    posterUri != null
      ? { uri: posterUri }
      : slide.posterSource;

  return (
    <ScaledPressable onPress={onPress}>
      <View
        style={{
          width,
          height,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0B1220',
          overflow: 'hidden',
        }}>
        {poster ? (
          <Image
            source={poster}
            style={{ width, height, position: 'absolute' }}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : null}
        <View
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.28)',
          }}
        />
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: 'rgba(0,0,0,0.62)',
            borderWidth: 2,
            borderColor: 'rgba(255,255,255,0.85)',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="play" size={34} color="#FFFFFF" style={{ marginLeft: 3 }} />
        </View>
        <View
          style={{
            position: 'absolute',
            left: 14,
            bottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            borderRadius: 999,
            backgroundColor: 'rgba(0,0,0,0.7)',
            paddingHorizontal: 10,
            paddingVertical: 6,
          }}>
          <Ionicons name="videocam" size={14} color="#FACC15" />
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
            Product Video
          </Text>
        </View>
      </View>
    </ScaledPressable>
  );
}

export function ProductImageCarousel({
  images,
  media,
  onMenuPress,
}: ProductImageCarouselProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const galleryRef = useRef<FlatList<ProductGallerySlide>>(null);
  const slides = useMemo(() => buildSlides(media, images), [media, images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [videoOpen, setVideoOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{
    url: string;
    posterUri?: string | null;
  } | null>(null);
  const [posterByKey, setPosterByKey] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const videos = slides.filter(
      (slide): slide is Extract<ProductGallerySlide, { kind: 'VIDEO' }> =>
        slide.kind === 'VIDEO',
    );
    if (!videos.length) return;

    void (async () => {
      const next: Record<string, string> = {};
      for (const video of videos) {
        if (
          video.posterSource &&
          typeof video.posterSource === 'object' &&
          'uri' in video.posterSource &&
          video.posterSource.uri
        ) {
          next[video.key] = video.posterSource.uri;
          continue;
        }
        try {
          const thumb = await VideoThumbnails.getThumbnailAsync(video.url, {
            time: 800,
            quality: 0.7,
          });
          if (!cancelled && thumb?.uri) {
            next[video.key] = thumb.uri;
          }
        } catch {
          /* thumbnail generation can fail on some Android devices */
        }
      }
      if (!cancelled && Object.keys(next).length) {
        setPosterByKey((prev) => ({ ...prev, ...next }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slides]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const active = slides[activeIndex];
    if (active?.kind === 'VIDEO') return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        let next = (prev + 1) % slides.length;
        if (slides[next]?.kind === 'VIDEO') {
          next = (next + 1) % slides.length;
          if (slides[next]?.kind === 'VIDEO' || next === prev) return prev;
        }
        scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [slides, activeIndex]);

  const openVideoPlayer = (slide: Extract<ProductGallerySlide, { kind: 'VIDEO' }>) => {
    const posterUri =
      posterByKey[slide.key] ??
      (slide.posterSource &&
      typeof slide.posterSource === 'object' &&
      'uri' in slide.posterSource
        ? slide.posterSource.uri
        : null);
    setActiveVideo({ url: slide.url, posterUri });
    setVideoOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openGallery = (index: number) => {
    const slide = slides[index];
    if (slide?.kind === 'VIDEO') {
      openVideoPlayer(slide);
      return;
    }
    setGalleryIndex(index);
    setGalleryOpen(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const closeVideo = () => {
    setVideoOpen(false);
    setActiveVideo(null);
  };

  if (!slides.length) {
    return <View style={{ height: 280, backgroundColor: '#FFFFFF' }} />;
  }

  const playerHeight = Math.min(SCREEN_HEIGHT - insets.top - insets.bottom - 80, SCREEN_WIDTH * 1.6);

  return (
    <View style={{ height: 280, backgroundColor: '#FFFFFF' }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}>
        {slides.map((slide, i) =>
          slide.kind === 'VIDEO' ? (
            <VideoSlidePreview
              key={slide.key}
              slide={slide}
              width={SCREEN_WIDTH}
              height={280}
              posterUri={posterByKey[slide.key]}
              onPress={() => openGallery(i)}
            />
          ) : (
            <ScaledPressable key={slide.key} onPress={() => openGallery(i)}>
              <Image
                source={slide.source}
                style={{ width: SCREEN_WIDTH, height: 280 }}
                contentFit="contain"
                recyclingKey={`carousel-${slide.key}`}
                cachePolicy="memory-disk"
                transition={200}
              />
            </ScaledPressable>
          ),
        )}
      </ScrollView>

      {onMenuPress && (
        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 8 }}>
          <ScaledPressable onPress={onMenuPress} className="rounded-full bg-black/30 p-2">
            <Ionicons name="menu" size={22} color="#FFFFFF" />
          </ScaledPressable>
          <View className="rounded-full bg-black/30 px-3 py-1.5">
            <BrandLogo size="sm" />
          </View>
          <View className="w-10" />
        </View>
      )}

      <View className="absolute bottom-3 left-0 right-0 flex-row items-center justify-center gap-2">
        {slides.map((slide, i) => (
          <View
            key={slide.key}
            className={`h-2 rounded-full ${
              i === activeIndex
                ? slide.kind === 'VIDEO'
                  ? 'w-5 bg-amber-400'
                  : 'w-5 bg-primary'
                : 'w-2 bg-white/60'
            }`}
          />
        ))}
      </View>

      {/* Image-only lightbox — video uses a dedicated player modal below */}
      <Modal
        visible={galleryOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setGalleryOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#000000',
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}>
          <View
            style={{
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
            }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
              {galleryIndex + 1} / {slides.length}
            </Text>
            <ScaledPressable
              onPress={() => setGalleryOpen(false)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="close" size={20} color="#fff" />
            </ScaledPressable>
          </View>

          <FlatList
            ref={galleryRef}
            horizontal
            pagingEnabled
            initialScrollIndex={Math.min(galleryIndex, Math.max(slides.length - 1, 0))}
            getItemLayout={(_, index) => ({
              length: SCREEN_WIDTH,
              offset: SCREEN_WIDTH * index,
              index,
            })}
            data={slides}
            keyExtractor={(item) => item.key}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(
                e.nativeEvent.contentOffset.x / SCREEN_WIDTH,
              );
              setGalleryIndex(index);
              const slide = slides[index];
              if (slide?.kind === 'VIDEO') {
                setGalleryOpen(false);
                openVideoPlayer(slide);
              }
            }}
            renderItem={({ item: slide }) => {
              if (slide.kind === 'VIDEO') {
                return (
                  <VideoSlidePreview
                    slide={slide}
                    width={SCREEN_WIDTH}
                    height={Math.min(SCREEN_HEIGHT * 0.72, SCREEN_WIDTH * 1.2)}
                    posterUri={posterByKey[slide.key]}
                    onPress={() => {
                      setGalleryOpen(false);
                      openVideoPlayer(slide);
                    }}
                  />
                );
              }

              return (
                <View
                  style={{
                    width: SCREEN_WIDTH,
                    height: Math.min(SCREEN_HEIGHT * 0.72, SCREEN_WIDTH),
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                  <Image
                    source={slide.source}
                    style={{
                      width: SCREEN_WIDTH,
                      height: Math.min(SCREEN_HEIGHT * 0.72, SCREEN_WIDTH),
                    }}
                    contentFit="contain"
                  />
                </View>
              );
            }}
          />
        </View>
      </Modal>

      {/* Dedicated fullscreen video player — avoids Android FlatList black-surface bug */}
      <Modal
        visible={videoOpen && Boolean(activeVideo)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeVideo}
        supportedOrientations={['portrait', 'landscape']}>
        <View
          style={{
            flex: 1,
            backgroundColor: '#000',
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}>
          <View
            style={{
              height: 52,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              zIndex: 2,
            }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
              Product Video
            </Text>
            <ScaledPressable
              onPress={closeVideo}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(255,255,255,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="close" size={20} color="#fff" />
            </ScaledPressable>
          </View>

          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: Platform.OS === 'android' ? 0 : 0,
            }}>
            {activeVideo ? (
              <View
                style={{
                  width: SCREEN_WIDTH,
                  height: playerHeight,
                  backgroundColor: '#000',
                }}>
                <ExpoVideoPlayer
                  key={activeVideo.url}
                  source={{ uri: activeVideo.url }}
                  autoPlay
                  muted={false}
                  loop={false}
                  contentFit="contain"
                  nativeControls
                  surfaceType="textureView"
                  posterUrl={activeVideo.posterUri}
                  style={{ width: SCREEN_WIDTH, height: playerHeight }}
                />
              </View>
            ) : (
              <ActivityIndicator color="#fff" />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
