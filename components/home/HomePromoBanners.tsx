import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import type { HeroSlide } from '@components/HeroCarousel';
import { normalizeMediaUrl, MEDIA_EMPTY_URI } from '@utils/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE_INSET = 16;
const CARD_GAP = 10;
/** Peek of next card; full-bleed image inside fixed frame */
const CARD_WIDTH = SCREEN_WIDTH - SIDE_INSET * 2 - 28;
/** ~2.2:1 banner ratio so CMS creatives fill edge-to-edge */
const CARD_HEIGHT = Math.round(CARD_WIDTH / 2.2);
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

interface HomePromoBannersProps {
  slides: HeroSlide[];
  /** @deprecated ignored — promo UI is image-only */
  title?: string | null;
  onPress?: (slide: HeroSlide, index: number) => void;
  /** @deprecated use onPress */
  onShopNow?: (slide: HeroSlide, index: number) => void;
}

/** Image-only HOME_PROMO carousel — tap opens Product / Catalog / route. */
export function HomePromoBanners({
  slides,
  onPress,
  onShopNow,
}: HomePromoBannersProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const handlePress = onPress ?? onShopNow;

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollTo({
          x: next * SNAP_INTERVAL,
          animated: true,
        });
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const onBannerPress = async (slide: HeroSlide, index: number) => {
    await Haptics.selectionAsync();
    handlePress?.(slide, index);
  };

  return (
    <View style={styles.section}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={SNAP_INTERVAL}
        snapToAlignment="start"
        disableIntervalMomentum
        onMomentumScrollEnd={(e) => {
          const index = Math.round(
            e.nativeEvent.contentOffset.x / SNAP_INTERVAL,
          );
          setActiveIndex(
            Math.max(0, Math.min(index, Math.max(slides.length - 1, 0))),
          );
        }}
        contentContainerStyle={styles.scrollContent}>
        {slides.map((slide, index) => (
          <Pressable
            key={slide.id ?? index}
            onPress={() => void onBannerPress(slide, index)}
            style={[
              styles.card,
              index === slides.length - 1 ? styles.cardLast : null,
            ]}
            accessibilityRole="button"
            accessibilityLabel={slide.title || 'Promo banner'}>
            <View style={styles.imageFrame} pointerEvents="none">
              <Image
                source={{
                  uri: normalizeMediaUrl(slide.imageUrl) || MEDIA_EMPTY_URI,
                }}
                style={styles.image}
                contentFit="cover"
                contentPosition="center"
                recyclingKey={slide.id ?? String(index)}
                transition={0}
              />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((slide, index) => (
            <View
              key={slide.id ?? index}
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : null,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 10,
  },
  scrollContent: {
    paddingHorizontal: SIDE_INSET,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: CARD_GAP,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#E8E8E8',
  },
  cardLast: {
    marginRight: 0,
  },
  imageFrame: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#D4D4D8',
  },
  dotActive: {
    width: 14,
    backgroundColor: '#FEB623',
  },
});
