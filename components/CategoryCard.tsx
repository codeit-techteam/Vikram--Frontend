import { Platform, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { ImageSourcePropType } from 'react-native';

import { ScaledPressable } from '@components/ScaledPressable';
import { colors } from '@constants/colors';

interface CategoryCardProps {
  name: string;
  image: ImageSourcePropType;
  /** @deprecated Counts are no longer shown on marketplace category cards. */
  productCount?: number;
  /** @deprecated Counts are no longer shown on marketplace category cards. */
  productCountLabel?: string;
  onPress: () => void;
}

/** Premium marketplace category card — matches Home MaterialCategoryCard. */
export function CategoryCard({ name, image, onPress }: CategoryCardProps) {
  return (
    <ScaledPressable
      onPress={onPress}
      scaleTo={0.97}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={name}
      android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}>
      <View style={styles.imageWrap}>
        <Image
          source={image}
          style={styles.image}
          contentFit="cover"
          recyclingKey={name}
          cachePolicy="memory-disk"
          priority="low"
          transition={200}
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />
      </View>
      <Text
        style={styles.label}
        numberOfLines={2}
        ellipsizeMode="tail"
        {...(Platform.OS === 'android'
          ? { textBreakStrategy: 'highQuality' as const }
          : {})}>
        {name}
      </Text>
    </ScaledPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    elevation: 3,
    flex: 1,
    marginBottom: 4,
    paddingBottom: 10,
    paddingHorizontal: 8,
    paddingTop: 10,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageWrap: {
    aspectRatio: 1,
    backgroundColor: colors.inputBg,
    borderRadius: 12,
    overflow: 'hidden',
    width: '100%',
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 8,
    minHeight: 36,
    paddingHorizontal: 2,
    textAlign: 'center',
    width: '100%',
  },
});
