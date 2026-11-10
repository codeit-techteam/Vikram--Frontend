import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { BrandLogo } from '@components/BrandLogo';
import {
  BRAND_IVORY,
  BRAND_SPLASH_TAGLINE,
  theme,
} from '@constants/theme';

const CONSTRUCTION_IMAGE = require('../../assets/images/bajriwala-splash-construction.jpg');

/** Bottom band stays ~45–50% across common phone aspect ratios. */
function constructionBandHeight(windowHeight: number, topInset: number): number {
  const usable = windowHeight - topInset;
  return Math.round(Math.min(Math.max(usable * 0.48, 240), usable * 0.54));
}

function logoHeight(windowWidth: number): number {
  if (windowWidth < 360) return 56;
  if (windowWidth > 430) return 78;
  return 68;
}

interface BrandedSplashProps {
  onReady?: () => void;
}

export function BrandedSplash({ onReady }: BrandedSplashProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const brandOpacity = useSharedValue(1);
  const brandScale = useSharedValue(1);
  const taglineOpacity = useSharedValue(1);
  const imageOpacity = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      brandOpacity.value = 1;
      brandScale.value = 1;
      taglineOpacity.value = 1;
      imageOpacity.value = 1;
      return;
    }

    brandOpacity.value = 0;
    brandScale.value = 0.97;
    taglineOpacity.value = 0;
    imageOpacity.value = 0;

    const ease = Easing.out(Easing.cubic);
    brandOpacity.value = withTiming(1, { duration: 420, easing: ease });
    brandScale.value = withTiming(1, { duration: 520, easing: ease });
    taglineOpacity.value = withDelay(140, withTiming(1, { duration: 380, easing: ease }));
    imageOpacity.value = withDelay(80, withTiming(1, { duration: 520, easing: ease }));
  }, [reduceMotion, brandOpacity, brandScale, taglineOpacity, imageOpacity]);

  const brandStyle = useAnimatedStyle(() => ({
    opacity: brandOpacity.value,
    transform: [{ scale: brandScale.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const bandHeight = constructionBandHeight(height, insets.top);
  const markHeight = logoHeight(width);

  return (
    <View
      style={[styles.root, { paddingTop: insets.top }]}
      onLayout={() => onReady?.()}
      accessibilityRole="image"
      accessibilityLabel={`${theme.appName}. ${BRAND_SPLASH_TAGLINE}`}>
      <StatusBar style="dark" />

      <View style={styles.brandSection}>
        <Animated.View style={[styles.brandCluster, brandStyle]}>
          <BrandLogo height={markHeight} variant="onLight" />
        </Animated.View>
        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>{BRAND_SPLASH_TAGLINE}</Text>
        </Animated.View>
      </View>

      <Animated.View style={[styles.imageBand, { height: bandHeight }, imageStyle]}>
        <Image
          source={CONSTRUCTION_IMAGE}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="bottom center"
          transition={0}
          priority="high"
          accessible={false}
        />
        <LinearGradient
          colors={[BRAND_IVORY, 'rgba(252,247,228,0.72)', 'rgba(252,247,228,0)']}
          locations={[0, 0.35, 1]}
          style={styles.skyFade}
          pointerEvents="none"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandCluster: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 12,
    paddingHorizontal: 28,
  },
  imageBand: {
    backgroundColor: BRAND_IVORY,
    overflow: 'hidden',
    width: '100%',
  },
  root: {
    backgroundColor: BRAND_IVORY,
    flex: 1,
  },
  skyFade: {
    height: 72,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tagline: {
    color: theme.black,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1.2,
    lineHeight: 20,
    marginTop: 14,
    textAlign: 'center',
  },
});
