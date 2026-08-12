import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { REVIEW_CARD_WIDTH } from '@components/testimonial/constants';
import { StarRating } from '@components/testimonial/StarRating';
import type { TestimonialReview } from '@constants/testimonialData';
import { useTranslation } from '@store/languageStore';

const GOLD = '#FEB623';
const REVIEW_COLLAPSE_LINES = 3;
const REVIEW_EXPAND_THRESHOLD = 110;

interface CustomerReviewCardProps {
  item: TestimonialReview;
  onPhotoPress?: (item: TestimonialReview) => void;
}

function hasPhoto(photo: TestimonialReview['photo']): boolean {
  if (!photo) return false;
  if (typeof photo === 'number') return true;
  if (typeof photo === 'object' && 'uri' in photo) {
    const uri = photo.uri;
    return typeof uri === 'string' && uri.startsWith('http');
  }
  return false;
}

export function CustomerReviewCard({ item, onPhotoPress }: CustomerReviewCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const initials = item.customerName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const showPhoto = hasPhoto(item.photo);
  const canExpand = item.review.length > REVIEW_EXPAND_THRESHOLD;

  const toggleExpand = async () => {
    await Haptics.selectionAsync();
    setExpanded((prev) => !prev);
  };

  return (
    <View style={[styles.card, showPhoto ? styles.cardWithPhoto : styles.cardPlain]}>
      {showPhoto ? (
        <ScaledPressable
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPhotoPress?.(item);
          }}
          style={styles.photoPressable}
          scaleTo={0.98}>
          <Image source={item.photo!} style={styles.photo} contentFit="cover" />
          <View style={styles.photoScrim} />
        </ScaledPressable>
      ) : (
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      )}

      <View style={showPhoto ? styles.body : styles.bodyPlain}>
        <View style={styles.nameRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {item.customerName}
            </Text>
            <Text style={styles.businessType} numberOfLines={1}>
              {item.businessType}
            </Text>
          </View>
          <StarRating rating={item.rating} size={12} />
        </View>

        <View style={styles.quoteWrap}>
          <View style={styles.quoteAccent} />
          <View style={styles.quoteColumn}>
            <Text
              style={styles.review}
              numberOfLines={expanded ? undefined : REVIEW_COLLAPSE_LINES}>
              &ldquo;{item.review}&rdquo;
            </Text>
            {canExpand ? (
              <Pressable
                onPress={() => void toggleExpand()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={expanded ? t('showLess') : t('readMore')}>
                <Text style={styles.readMore}>
                  {expanded ? t('showLess') : t('readMore')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: REVIEW_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEFEF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  cardWithPhoto: {
    padding: 0,
  },
  cardPlain: {
    minHeight: 168,
  },
  photoPressable: {
    width: '100%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: 112,
    backgroundColor: '#F3F4F6',
  },
  photoScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.04)',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 10,
  },
  bodyPlain: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
  },
  avatarRow: {
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(254, 182, 35, 0.35)',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.1,
  },
  businessType: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  quoteWrap: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  quoteAccent: {
    width: 3,
    alignSelf: 'stretch',
    minHeight: 32,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginTop: 2,
  },
  quoteColumn: {
    flex: 1,
    gap: 4,
  },
  review: {
    fontSize: 12,
    color: '#4B5563',
    lineHeight: 17,
    fontStyle: 'italic',
  },
  readMore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
});
