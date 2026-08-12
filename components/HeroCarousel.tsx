import { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { ScaledPressable } from '@components/ScaledPressable';
import { normalizeMediaUrl, MEDIA_EMPTY_URI } from '@utils/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

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

export function HeroCarousel({ slides, onShopNow, onBulkInquiry }: HeroCarouselProps) {
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

  const handleShopNow = async (slide: HeroSlide, index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShopNow?.(slide, index);
  };

  const handleBulkInquiry = async (slide: HeroSlide, index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBulkInquiry?.(slide, index);
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
          <View key={slide.id ?? i} style={{ width: CARD_WIDTH }} className="overflow-hidden rounded-card">
            <Image
              source={{
                uri: normalizeMediaUrl(slide.imageUrl) || MEDIA_EMPTY_URI,
              }}
              style={{ width: CARD_WIDTH, height: 180 }}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <View className="absolute left-4 top-4">
              {slide.badge ? (
                <View className="rounded-full bg-primary px-3 py-1">
                  <Text className="text-xs font-bold text-onPrimary">{slide.badge}</Text>
                </View>
              ) : null}
            </View>
            <View className="absolute bottom-4 left-4 right-4">
              <Text className="text-lg font-bold leading-6 text-text-inverse">{slide.title}</Text>
              {slide.subtitle ? (
                <Text className="mt-1 text-sm leading-5 text-text-inverse/90" numberOfLines={3}>
                  {slide.subtitle}
                </Text>
              ) : null}
              {slide.shopNow || slide.bulkInquiry ? (
                <View className="mt-3 flex-row gap-3">
                  {slide.shopNow ? (
                    <ScaledPressable
                      onPress={() => void handleShopNow(slide, i)}
                      hitSlop={8}
                      style={{
                        backgroundColor: '#1A73E8',
                        paddingHorizontal: 18,
                        paddingVertical: 9,
                        borderRadius: 8,
                      }}>
                      <Text className="text-sm font-bold text-text-inverse">{slide.shopNow}</Text>
                    </ScaledPressable>
                  ) : null}
                  {slide.bulkInquiry ? (
                    <ScaledPressable
                      onPress={() => void handleBulkInquiry(slide, i)}
                      hitSlop={8}
                      style={{
                        borderWidth: 1.5,
                        borderColor: '#FFFFFF',
                        paddingHorizontal: 18,
                        paddingVertical: 9,
                        borderRadius: 8,
                      }}>
                      <Text className="text-sm font-bold text-text-inverse">{slide.bulkInquiry}</Text>
                    </ScaledPressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
      {slides.length > 1 ? (
        <View className="mt-3 flex-row items-center justify-center gap-2">
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
