import { useEffect, useRef, useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { ScaledPressable } from '@components/ScaledPressable';
import { images } from '@constants/images';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 32;

interface HeroSlide {
  badge: string;
  title: string;
  shopNow: string;
  bulkInquiry: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  onShopNow?: () => void;
  onBulkInquiry?: () => void;
}

export function HeroCarousel({ slides, onShopNow, onBulkInquiry }: HeroCarouselProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: next * CARD_WIDTH, animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleShopNow = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onShopNow?.();
  };

  const handleBulkInquiry = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBulkInquiry?.();
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
          <View key={i} style={{ width: CARD_WIDTH }} className="overflow-hidden rounded-card">
            <Image
              source={{ uri: images.loginBanner }}
              style={{ width: CARD_WIDTH, height: 180 }}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
            />
            <View className="absolute left-4 top-4">
              <View className="rounded-full bg-primary px-3 py-1">
                <Text className="text-xs font-bold text-onPrimary">{slide.badge}</Text>
              </View>
            </View>
            <View className="absolute bottom-4 left-4 right-4">
              <Text className="text-lg font-bold leading-6 text-text-inverse">{slide.title}</Text>
              <View className="mt-3 flex-row gap-3">
                <ScaledPressable
                  onPress={handleShopNow}
                  hitSlop={8}
                  style={{
                    backgroundColor: '#1A73E8',
                    paddingHorizontal: 18,
                    paddingVertical: 9,
                    borderRadius: 8,
                  }}>
                  <Text className="text-sm font-bold text-text-inverse">{slide.shopNow}</Text>
                </ScaledPressable>
                <ScaledPressable
                  onPress={handleBulkInquiry}
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
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
      <View className="mt-3 flex-row items-center justify-center gap-2">
        {slides.map((_, i) => (
          <View
            key={i}
            className={`h-2 rounded-full ${i === activeIndex ? 'w-5 bg-primary' : 'w-2 bg-border'}`}
          />
        ))}
      </View>
    </View>
  );
}
