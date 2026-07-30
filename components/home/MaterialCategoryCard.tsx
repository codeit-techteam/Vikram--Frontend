import { memo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import { colors } from '@constants/colors';

interface MaterialCategoryCardProps {
  label: string;
  image: number | { uri: string };
  onPress: () => void;
  /** Optional product count — future-ready, hidden when 0/undefined. */
  productCount?: number;
  /** Staggered fade-in delay in ms after the grid mounts. */
  fadeDelay?: number;
}

/** Vertical-grid category tile used on Home Material Categories. */
function MaterialCategoryCardComponent({
  label,
  image,
  onPress,
  productCount,
  fadeDelay = 0,
}: MaterialCategoryCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(8);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 280 });
      translateY.value = withTiming(0, { duration: 280 });
    }, fadeDelay);
    return () => clearTimeout(timeout);
  }, [fadeDelay, opacity, translateY]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const showCount = typeof productCount === 'number' && productCount > 0;

  return (
    <Animated.View style={[styles.wrap, fadeStyle]}>
      <ScaledPressable
        onPress={onPress}
        scaleTo={0.94}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={label}>
        <View style={styles.imageWrap}>
          <Image
            source={image}
            style={styles.image}
            contentFit="cover"
            recyclingKey={label}
            cachePolicy="memory-disk"
            priority="low"
          />
        </View>
        <Text style={styles.label} numberOfLines={2} ellipsizeMode="tail">
          {label}
        </Text>
        {showCount ? (
          <Text style={styles.count} numberOfLines={1}>
            {productCount} items
          </Text>
        ) : null}
      </ScaledPressable>
    </Animated.View>
  );
}

export const MaterialCategoryCard = memo(MaterialCategoryCardComponent);

const IMAGE_SIZE = 68;

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  card: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  imageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 16,
    minHeight: 32,
  },
  count: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
