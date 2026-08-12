import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { ScaledPressable } from '@components/ScaledPressable';
import type { HeroSlide } from '@components/HeroCarousel';
import { normalizeMediaUrl, MEDIA_EMPTY_URI } from '@utils/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const CARD_WIDTH = SCREEN_WIDTH - H_PAD * 2;
const CARD_HEIGHT = 210;

interface HomePromoBannersProps {
  slides: HeroSlide[];
  title?: string | null;
  onShopNow?: (slide: HeroSlide, index: number) => void;
}

/** Dedicated HOME_PROMO / Bulk Offer carousel — image-forward with clear Shop Now CTA. */
export function HomePromoBanners({
  slides,
  title,
  onShopNow,
}: HomePromoBannersProps) {
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
    }, 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  if (slides.length === 0) return null;

  const handleShopNow = async (slide: HeroSlide, index: number) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onShopNow?.(slide, index);
  };

  const handleCardPress = async (slide: HeroSlide, index: number) => {
    if (!slide.linkTarget && !slide.shopNow) return;
    await handleShopNow(slide, index);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>BULK OFFERS</Text>
          <Text style={styles.title}>{title?.trim() || 'Home Promo'}</Text>
        </View>
        {slides.length > 1 ? (
          <Text style={styles.count}>
            {activeIndex + 1}/{slides.length}
          </Text>
        ) : null}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
          setActiveIndex(index);
        }}
        contentContainerStyle={styles.scrollContent}>
        {slides.map((slide, index) => {
          const ctaLabel = slide.shopNow?.trim() || 'Shop Now';
          return (
            <Pressable
              key={slide.id ?? index}
              onPress={() => void handleCardPress(slide, index)}
              style={styles.card}
              accessibilityRole="button"
              accessibilityLabel={`${slide.title}. ${ctaLabel}`}>
              <Image
                source={{
                  uri: normalizeMediaUrl(slide.imageUrl) || MEDIA_EMPTY_URI,
                }}
                style={styles.image}
                contentFit="cover"
              />
              <LinearGradient
                colors={['rgba(8,18,40,0.05)', 'rgba(8,18,40,0.78)']}
                locations={[0.35, 1]}
                style={StyleSheet.absoluteFill}
              />

              {slide.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{slide.badge}</Text>
                </View>
              ) : (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>BULK</Text>
                </View>
              )}

              <View style={styles.copy}>
                <Text style={styles.slideTitle} numberOfLines={2}>
                  {slide.title}
                </Text>
                {slide.subtitle ? (
                  <Text style={styles.slideSubtitle} numberOfLines={2}>
                    {slide.subtitle}
                  </Text>
                ) : null}
                <ScaledPressable
                  onPress={() => void handleShopNow(slide, index)}
                  hitSlop={8}
                  style={styles.cta}>
                  <Text style={styles.ctaText}>{ctaLabel}</Text>
                </ScaledPressable>
              </View>
            </Pressable>
          );
        })}
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
    gap: 12,
  },
  headerRow: {
    paddingHorizontal: H_PAD,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  headerText: {
    gap: 2,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: '#B45309',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  count: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  scrollContent: {
    paddingHorizontal: H_PAD,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#FEB623',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.4,
  },
  copy: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    gap: 6,
  },
  slideTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  slideSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 18,
  },
  cta: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#1A73E8',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: '#D4D4D8',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FEB623',
  },
});
