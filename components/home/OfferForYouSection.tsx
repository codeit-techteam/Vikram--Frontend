import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';

import type { CmsOffer } from '@/types/cms';
import { resolveCmsImageSource } from '@utils/cmsMedia';

interface OfferForYouSectionProps {
  offers: CmsOffer[];
  title?: string | null;
}

export function OfferForYouSection({
  offers,
  title = 'Offers For You',
}: OfferForYouSectionProps) {
  if (!offers.length) return null;

  const onPress = async (offer: CmsOffer) => {
    await Haptics.selectionAsync();
    router.push(`/offers/${offer.slug}` as Href);
  };

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        decelerationRate="fast"
        snapToAlignment="start">
        {offers.map((offer) => (
          <Pressable
            key={offer.id}
            onPress={() => void onPress(offer)}
            style={styles.card}
            accessibilityRole="button">
            <Image
              source={resolveCmsImageSource(offer.imageUrl)}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
            {offer.discountLabel || offer.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {offer.discountLabel || offer.badge}
                </Text>
              </View>
            ) : null}
            <Text style={styles.cardTitle} numberOfLines={2}>
              {offer.title}
            </Text>
            {offer.description ? (
              <Text style={styles.desc} numberOfLines={2}>
                {offer.description}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingLeft: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
    paddingRight: 16,
  },
  row: {
    paddingRight: 16,
    gap: 12,
  },
  card: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    paddingBottom: 10,
  },
  image: {
    width: '100%',
    height: 100,
    backgroundColor: '#EEE',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FEB623',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  cardTitle: {
    marginTop: 8,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  desc: {
    marginTop: 2,
    paddingHorizontal: 10,
    fontSize: 11,
    color: '#666',
  },
});
