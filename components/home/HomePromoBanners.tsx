import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { CmsPromoSlide } from '@utils/cmsAdapters';
import {
  resolvePromoTheme,
  splitPromoHeadline,
} from '@utils/promoBannerTheme';
import {
  isEmptyPlaceholderUri,
  normalizeMediaUrl,
} from '@utils/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE_INSET = 16;
const CARD_GAP = 10;
const CARD_WIDTH = SCREEN_WIDTH - SIDE_INSET * 2 - 28;
const CARD_HEIGHT = 168;
const SNAP_INTERVAL = CARD_WIDTH + CARD_GAP;

interface HomePromoBannersProps {
  slides: CmsPromoSlide[];
  title?: string | null;
  onPress?: (slide: CmsPromoSlide, index: number) => void;
  loading?: boolean;
}

function hasBannerContent(slide: CmsPromoSlide): boolean {
  const remote = normalizeMediaUrl(slide.imageUrl);
  if (remote && !isEmptyPlaceholderUri(remote)) return true;
  if (slide.localImage) return true;
  return Boolean(slide.title?.trim());
}

export function HomePromoBannerSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.scrollContent}>
        <View style={[styles.card, styles.skeleton]} />
      </View>
    </View>
  );
}

function PromoSlideCard({
  slide,
  onPress,
}: {
  slide: CmsPromoSlide;
  onPress: () => void;
}) {
  const theme = resolvePromoTheme(slide);
  const { lead, accent } = splitPromoHeadline(slide.title);
  const remote = normalizeMediaUrl(slide.imageUrl);
  const imageSource =
    remote && !isEmptyPlaceholderUri(remote)
      ? { uri: remote }
      : slide.localImage;
  const cta = slide.ctaLabel?.trim() || 'Shop Now';

  return (
    <Pressable
      onPress={onPress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={slide.title || 'Promo banner'}>
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.gradient}>
        <View style={styles.copy}>
          {slide.badge ? (
            <View style={[styles.badge, { backgroundColor: theme.badgeBg }]}>
              <Text style={[styles.badgeText, { color: theme.badgeText }]}>
                {slide.badge}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.lead, { color: theme.leadColor }]} numberOfLines={2}>
            {lead}
          </Text>
          {accent ? (
            <Text
              style={[styles.accent, { color: theme.accentColor }]}
              numberOfLines={2}>
              {accent}
            </Text>
          ) : null}

          {slide.subtitle ? (
            <Text
              style={[styles.subtitle, { color: theme.subtitleColor }]}
              numberOfLines={2}>
              {slide.subtitle}
            </Text>
          ) : null}

          <View style={[styles.cta, { backgroundColor: theme.ctaBg }]}>
            <Text style={[styles.ctaText, { color: theme.ctaText }]}>{cta}</Text>
            <View style={[styles.ctaIcon, { backgroundColor: theme.ctaText }]}>
              <Ionicons name="arrow-forward" size={10} color={theme.ctaBg} />
            </View>
          </View>
        </View>

        <View style={styles.art} pointerEvents="none">
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.image}
              contentFit="contain"
              contentPosition="center"
              recyclingKey={slide.id}
              transition={180}
              cachePolicy="memory-disk"
            />
          ) : null}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

/** CMS-driven HOME_PROMO carousel — title, offer, CTA, and product art from Admin. */
export function HomePromoBanners({
  slides,
  onPress,
  loading = false,
}: HomePromoBannersProps) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleSlides = useMemo(
    () => slides.filter(hasBannerContent),
    [slides],
  );

  useEffect(() => {
    if (visibleSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % visibleSlides.length;
        scrollRef.current?.scrollTo({
          x: next * SNAP_INTERVAL,
          animated: true,
        });
        return next;
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [visibleSlides.length]);

  if (loading && visibleSlides.length === 0) {
    return <HomePromoBannerSkeleton />;
  }

  if (visibleSlides.length === 0) return null;

  const onBannerPress = async (slide: CmsPromoSlide, index: number) => {
    await Haptics.selectionAsync();
    onPress?.(slide, index);
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
            Math.max(0, Math.min(index, Math.max(visibleSlides.length - 1, 0))),
          );
        }}
        contentContainerStyle={styles.scrollContent}>
        {visibleSlides.map((slide, index) => (
          <View
            key={slide.id ?? index}
            style={[
              styles.cardWrap,
              index === visibleSlides.length - 1 ? styles.cardLast : null,
            ]}>
            <PromoSlideCard
              slide={slide}
              onPress={() => void onBannerPress(slide, index)}
            />
          </View>
        ))}
      </ScrollView>

      {visibleSlides.length > 1 ? (
        <View style={styles.dots}>
          {visibleSlides.map((slide, index) => (
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
  cardWrap: {
    marginRight: CARD_GAP,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFF6E8',
  },
  cardLast: {
    marginRight: 0,
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 12,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  lead: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 20,
    textTransform: 'uppercase',
  },
  accent: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
    lineHeight: 20,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    marginTop: 2,
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  ctaText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  ctaIcon: {
    width: 16,
    height: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  art: {
    width: CARD_WIDTH * 0.4,
    height: '100%',
    paddingRight: 8,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skeleton: {
    backgroundColor: '#E8E8E8',
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
