import { useEffect, useRef } from 'react';
import {
  Dimensions,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import type { CmsDeliveryPromotion } from '@/types/cms';
import { trackDeliveryPromotionEvent } from '@utils/deliveryPromotionAnalytics';
import { isEmptyPlaceholderUri, normalizeMediaUrl } from '@utils/media';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const H_PAD = 16;
const CARD_RADIUS = 18;
const BANNER_ASPECT = 1024 / 174;
const BANNER_BG = '#FFCB05';

interface DeliveryPromotionBannerProps {
  promotion: CmsDeliveryPromotion | null;
  loading?: boolean;
  onPress?: (promotion: CmsDeliveryPromotion) => void;
}

export function DeliveryPromotionBannerSkeleton() {
  return (
    <View style={styles.section}>
      <View style={[styles.card, styles.skeleton]} />
    </View>
  );
}

export function DeliveryPromotionBanner({
  promotion,
  loading = false,
  onPress,
}: DeliveryPromotionBannerProps) {
  const impressed = useRef(false);

  useEffect(() => {
    if (!promotion?.id || impressed.current) return;
    impressed.current = true;
    trackDeliveryPromotionEvent('delivery_promotion_impression', {
      id: promotion.id,
      title: promotion.title,
      placement: promotion.placement,
    });
  }, [promotion]);

  if (loading && !promotion) {
    return <DeliveryPromotionBannerSkeleton />;
  }

  const imageUrl = normalizeMediaUrl(
    promotion?.mobileBannerImage || promotion?.bannerImage,
  );
  const hasImage = Boolean(imageUrl) && !isEmptyPlaceholderUri(imageUrl);

  if (!promotion || !hasImage) {
    return null;
  }

  const ctaEnabled = promotion.cta.enabled === true;
  const label = [promotion.title, promotion.subtitle].filter(Boolean).join('. ');

  const handlePress = async () => {
    if (!ctaEnabled) return;
    await Haptics.selectionAsync();
    trackDeliveryPromotionEvent('delivery_promotion_click', {
      id: promotion.id,
      title: promotion.title,
    });
    if (promotion.cta.label) {
      trackDeliveryPromotionEvent('delivery_promotion_cta_click', {
        id: promotion.id,
        label: promotion.cta.label,
        type: promotion.cta.type,
        value: promotion.cta.value,
      });
    }
    onPress?.(promotion);
  };

  const image = (
    <Image
      source={{ uri: imageUrl! }}
      style={styles.image}
      contentFit="contain"
      contentPosition="center"
      recyclingKey={promotion.id}
      transition={180}
      cachePolicy="memory-disk"
      accessibilityLabel={label || 'Delivery promotion'}
    />
  );

  if (!ctaEnabled) {
    return (
      <View style={styles.section}>
        <View
          style={styles.card}
          accessible
          accessibilityRole="image"
          accessibilityLabel={label}>
          {image}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Pressable
        onPress={() => void handlePress()}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={
          promotion.cta.label
            ? `${label}. ${promotion.cta.label}`
            : label
        }>
        {image}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: H_PAD,
    paddingTop: 8,
    width: SCREEN_WIDTH,
  },
  card: {
    width: '100%',
    aspectRatio: BANNER_ASPECT,
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: BANNER_BG,
    shadowColor: '#111111',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skeleton: {
    backgroundColor: '#E8E8E8',
  },
});
