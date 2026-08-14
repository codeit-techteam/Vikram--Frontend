import { useCallback, useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';

import type { CmsOffer } from '@/types/cms';
import { resolveCmsImageSource } from '@utils/cmsMedia';
import { navigateToOffer } from '@utils/offerCta';
import { trackOfferEvent } from '@utils/offerAnalytics';
import { formatINR } from '@utils/formatCurrency';

const CARD_GAP = 12;
const SIDE_PAD = 16;
const PRIMARY = '#FEB623';
const DARK = '#1A1A1A';
const GREEN = '#2E7D32';

interface OfferForYouSectionProps {
  offers: CmsOffer[];
  title?: string | null;
  loading?: boolean;
}

export function OfferForYouSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.skelTitle} />
        <View style={styles.skelLink} />
      </View>
      <View style={styles.row}>
        <View style={[styles.skelCard, { width: 280 }]} />
        <View style={[styles.skelCard, { width: 280 }]} />
      </View>
    </View>
  );
}

function OfferCard({
  offer,
  width,
  onPress,
}: {
  offer: CmsOffer;
  width: number;
  onPress: (offer: CmsOffer) => void;
}) {
  const image =
    resolveCmsImageSource(offer.mobileImageUrl || offer.imageUrl);
  const badge = offer.badge;
  const savings =
    offer.discountLabel && offer.discountLabel !== offer.badge
      ? offer.discountLabel
      : offer.discountPercent
        ? `${offer.discountPercent}% OFF`
        : offer.discountValue
          ? `Save ₹${offer.discountValue}`
          : null;

  return (
    <Pressable
      onPress={() => onPress(offer)}
      style={[styles.card, { width }]}
      accessibilityRole="button"
      accessibilityLabel={offer.title}>
      <View style={styles.imageWrap}>
        {image ? (
          <Image
            source={image}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={styles.imageFallback}>
            <Text style={styles.fallbackMark}>Bajriwala</Text>
          </View>
        )}
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {offer.title}
        </Text>
        {offer.description ? (
          <Text style={styles.desc} numberOfLines={2}>
            {offer.description}
          </Text>
        ) : null}
        {offer.startingFrom ? (
          <Text style={styles.fromPrice}>
            From {formatINR(offer.startingFrom)}
          </Text>
        ) : null}
        {savings ? <Text style={styles.savings}>{savings}</Text> : null}
        {typeof offer.productCount === 'number' ? (
          <Text style={styles.meta}>
            {offer.productCount} product{offer.productCount === 1 ? '' : 's'}{' '}
            included
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

export function OfferForYouSection({
  offers,
  title = 'Offers For You',
  loading = false,
}: OfferForYouSectionProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.min(300, Math.round(screenWidth * 0.78));
  const snapInterval = cardWidth + CARD_GAP;
  const [page, setPage] = useState(0);
  const impressed = useRef(new Set<string>());

  const onPress = useCallback(async (offer: CmsOffer) => {
    await Haptics.selectionAsync();
    navigateToOffer(offer, 'card');
  }, []);

  const onSeeAll = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push('/offers' as Href);
  }, []);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = event.nativeEvent.contentOffset.x;
      const next = Math.round(x / snapInterval);
      if (next !== page && next >= 0 && next < offers.length) {
        setPage(next);
      }
    },
    [offers.length, page, snapInterval],
  );

  useEffect(() => {
    offers.forEach((offer) => {
      if (!impressed.current.has(offer.id)) {
        impressed.current.add(offer.id);
        trackOfferEvent('offer_impression', { id: offer.id, slug: offer.slug });
      }
    });
  }, [offers]);

  if (loading) return <OfferForYouSkeleton />;
  if (!offers.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        {title ? <Text style={styles.title}>{title}</Text> : <View />}
        <Pressable onPress={() => void onSeeAll()} hitSlop={12}>
          <Text style={styles.seeAll}>See all →</Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        onScroll={onScroll}
        scrollEventThrottle={16}>
        {offers.map((offer) => (
          <OfferCard
            key={offer.id}
            offer={offer}
            width={cardWidth}
            onPress={(item) => void onPress(item)}
          />
        ))}
      </ScrollView>
      {offers.length > 1 ? (
        <View style={styles.dots}>
          {offers.map((offer, index) => (
            <View
              key={offer.id}
              style={[styles.dot, index === page && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingLeft: SIDE_PAD,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingRight: SIDE_PAD,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E5A01F',
  },
  row: {
    paddingRight: SIDE_PAD,
    gap: CARD_GAP,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  imageWrap: {
    width: '100%',
    height: 132,
    backgroundColor: '#FFF8E8',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PRIMARY,
  },
  fallbackMark: {
    fontSize: 16,
    fontWeight: '800',
    color: DARK,
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: DARK,
    letterSpacing: 0.3,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
  },
  desc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  fromPrice: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    color: DARK,
  },
  savings: {
    fontSize: 12,
    fontWeight: '700',
    color: GREEN,
  },
  meta: {
    fontSize: 11,
    color: '#888',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingRight: SIDE_PAD,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E0E0E0',
  },
  dotActive: {
    width: 16,
    backgroundColor: PRIMARY,
  },
  skelTitle: {
    width: 140,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#EEE',
  },
  skelLink: {
    width: 64,
    height: 14,
    borderRadius: 6,
    backgroundColor: '#EEE',
  },
  skelCard: {
    height: 260,
    borderRadius: 18,
    backgroundColor: '#EEE',
  },
});
