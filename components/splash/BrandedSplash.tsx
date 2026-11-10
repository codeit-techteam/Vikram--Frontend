import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
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

/** Construction materials scene only — logo is rendered separately for crispness. */
const CONSTRUCTION_IMAGE = require('../../assets/images/bajriwala-splash-construction.jpg');

/**
 * Bottom photograph occupies ~45–50% of usable height across common phone
 * aspect ratios, matching the brand reference composition.
 */
function sceneHeight(windowHeight: number, topInset: number, bottomInset: number): number {
  const usable = windowHeight - topInset - bottomInset;
  return Math.round(Math.min(Math.max(usable * 0.47, 250), usable * 0.5));
}

function logoHeight(windowWidth: number): number {
  if (windowWidth < 360) return 48;
  if (windowWidth > 430) return 68;
  return 58;
}

interface BrandedSplashProps {
  onReady?: () => void;
}

/**
 * Premium Bajriwala brand introduction.
 * Ivory wordmark + tagline over a photorealistic construction scene.
 * Animations are short and restrained; first paint is a complete composition
 * so native→JS splash handoff never flashes blank.
 */
export function BrandedSplash({ onReady }: BrandedSplashProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  const sceneProgress = useSharedValue(1);
  const sceneScale = useSharedValue(1);
  const logoProgress = useSharedValue(1);
  const taglineProgress = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) return;

    const easeOut = Easing.out(Easing.cubic);

    sceneProgress.value = 0.72;
    sceneScale.value = 1.04;
    logoProgress.value = 0;
    taglineProgress.value = 0;

    sceneProgress.value = withTiming(1, { duration: 520, easing: easeOut });
    sceneScale.value = withTiming(1, { duration: 1400, easing: easeOut });
    logoProgress.value = withDelay(
      80,
      withTiming(1, { duration: 420, easing: easeOut }),
    );
    taglineProgress.value = withDelay(
      220,
      withTiming(1, { duration: 380, easing: easeOut }),
    );
  }, [
    reduceMotion,
    sceneProgress,
    sceneScale,
    logoProgress,
    taglineProgress,
  ]);

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      sceneProgress.value,
      [0.72, 1],
      [0.85, 1],
      Extrapolation.CLAMP,
    ),
    transform: [{ scale: sceneScale.value }],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoProgress.value,
    transform: [
      {
        translateY: interpolate(
          logoProgress.value,
          [0, 1],
          [12, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineProgress.value,
    transform: [
      {
        translateY: interpolate(
          taglineProgress.value,
          [0, 1],
          [8, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const bandHeight = sceneHeight(height, insets.top, insets.bottom);
  const markHeight = logoHeight(width);

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
      onLayout={() => onReady?.()}
      accessibilityRole="image"
      accessibilityLabel={`${theme.appName}. ${BRAND_SPLASH_TAGLINE}`}>
      <StatusBar style="dark" />

      <View style={styles.brandSection}>
        <Animated.View style={[styles.brandCluster, logoStyle]}>
          <BrandLogo height={markHeight} variant="onLight" />
        </Animated.View>
        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>{BRAND_SPLASH_TAGLINE}</Text>
        </Animated.View>
      </View>

      <View style={[styles.imageBand, { height: bandHeight }]}>
        <Animated.View style={[StyleSheet.absoluteFill, sceneStyle]}>
          <Image
            source={CONSTRUCTION_IMAGE}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            contentPosition="center"
            transition={0}
            priority="high"
            recyclingKey="bajriwala-splash-construction"
            accessible={false}
            onError={() => {
              // Never crash the brand intro if the local asset fails to decode.
            }}
          />
        </Animated.View>

        <LinearGradient
          colors={[
            BRAND_IVORY,
            'rgba(252,247,228,0.82)',
            'rgba(252,247,228,0.28)',
            'rgba(252,247,228,0)',
          ]}
          locations={[0, 0.28, 0.62, 1]}
          style={styles.skyFade}
          pointerEvents="none"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  brandCluster: {
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '86%',
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
    height: 96,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tagline: {
    color: theme.black,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1.4,
    lineHeight: 22,
    marginTop: 14,
    textAlign: 'center',
  },
});
