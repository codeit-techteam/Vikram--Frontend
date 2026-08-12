import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import type { CmsAdvertisement } from '@/types/cms';
import { navigateCmsRedirect } from '@utils/cmsAdapters';
import { resolveCmsImageSource } from '@utils/cmsMedia';
import { MEDIA_EMPTY_URI } from '@utils/media';

const H_PAD = 16;

interface BrandAdsSectionProps {
  ads: CmsAdvertisement[];
  title?: string | null;
}

export function BrandAdsSection({ ads, title }: BrandAdsSectionProps) {
  if (ads.length === 0) return null;

  const onPress = async (ad: CmsAdvertisement) => {
    await Haptics.selectionAsync();
    navigateCmsRedirect(ad.redirectType, ad.redirectId);
  };

  return (
    <View style={styles.section}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        {ads.map((ad) => (
          <Pressable
            key={ad.id}
            onPress={() => void onPress(ad)}
            style={styles.card}
            accessibilityRole="button">
            <Image
              source={resolveCmsImageSource(ad.imageUrl) ?? { uri: MEDIA_EMPTY_URI }}
              style={styles.image}
              contentFit="contain"
            />
            <Text style={styles.brand} numberOfLines={1}>
              {ad.brandName}
            </Text>
            {ad.buttonText ? (
              <Text style={styles.cta}>{ad.buttonText}</Text>
            ) : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  header: {
    paddingHorizontal: H_PAD,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  row: {
    paddingHorizontal: H_PAD,
    gap: 12,
  },
  card: {
    width: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    alignItems: 'center',
  },
  image: {
    width: 72,
    height: 72,
    marginBottom: 8,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  cta: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    color: '#FEB623',
  },
});
