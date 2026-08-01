import { memo, useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
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
  /** Staggered fade-in delay in ms after the grid mounts. */
  fadeDelay?: number;
}

/** Premium marketplace category tile (Home + Catalog). */
function MaterialCategoryCardComponent({
  label,
  image,
  onPress,
  fadeDelay = 0,
}: MaterialCategoryCardProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.96);

  useEffect(() => {
    const timeout = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 150 });
      scale.value = withTiming(1, { duration: 150 });
    }, fadeDelay);
    return () => clearTimeout(timeout);
  }, [fadeDelay, opacity, scale]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, fadeStyle]}>
      <ScaledPressable
        onPress={onPress}
        scaleTo={0.97}
        style={styles.card}
        accessibilityRole="button"
        accessibilityLabel={label}
        android_ripple={{ color: 'rgba(0,0,0,0.06)', borderless: false }}>
        <View style={styles.imageWrap}>
          <Image
            source={image}
            style={styles.image}
            contentFit="cover"
            recyclingKey={label}
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
          {label}
        </Text>
      </ScaledPressable>
    </Animated.View>
  );
}

export const MaterialCategoryCard = memo(MaterialCategoryCardComponent);

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    elevation: 3,
    flex: 1,
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
  wrap: {
    flex: 1,
  },
});
