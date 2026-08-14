import { useEffect, useRef, useState } from 'react';
import { Dimensions, Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { normalizeMediaUrl, MEDIA_EMPTY_URI } from '@utils/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;
const CARD_HEIGHT = 180;

export interface HeroSlide {
  id?: string;
  badge: string;
  title: string;
  subtitle?: string;
  shopNow: string;
  bulkInquiry: string;
  imageUrl?: string;
  linkType?: string | null;
  linkTarget?: string | null;
  secondaryLinkType?: string | null;
  secondaryLinkTarget?: string | null;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  onShopNow?: (slide: HeroSlide, index: number) => void;
  onBulkInquiry?: (slide: HeroSlide, index: number) => void;
}

export function HeroCarousel({ slides, onShopNow }: HeroCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const handlePress = async (slide: HeroSlide, index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShopNow?.(slide, index);
  };

  return (
    <View style={{ marginHorizontal: 16 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
          setActiveIndex(index);
        }}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}>
        {slides.map((slide, i) => (
          <Pressable
            key={slide.id ?? i}
            onPress={() => void handlePress(slide, i)}
            style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
            className="overflow-hidden rounded-card"
            accessibilityRole="button"
            accessibilityLabel={slide.title || 'Hero banner'}>
            <Image
              source={{
                uri: normalizeMediaUrl(slide.imageUrl) || MEDIA_EMPTY_URI,
              }}
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
              contentFit="cover"
              contentPosition="center"
            />
          </Pressable>
        ))}
      </ScrollView>
      {slides.length > 1 ? (
        <View className="mt-2 flex-row items-center justify-center gap-2">
          {slides.map((slide, i) => (
            <View
              key={slide.id ?? i}
              className={`h-2 rounded-full ${i === activeIndex ? 'w-5 bg-primary' : 'w-2 bg-border'}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
