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
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { BrandLogo } from '@components/BrandLogo';
import {
  BRAND_IVORY,
  BRAND_SPLASH_TAGLINE,
  theme,
} from '@constants/theme';

const HERO_IMAGE = require('../../assets/images/bajriwala-splash-hero.jpg');

/** Bottom scene ~52–58% — matches the reference composition. */
function sceneHeight(windowHeight: number, topInset: number): number {
  const usable = windowHeight - topInset;
  return Math.round(Math.min(Math.max(usable * 0.55, 280), usable * 0.6));
}

function logoHeight(windowWidth: number): number {
  if (windowWidth < 360) return 52;
  if (windowWidth > 430) return 72;
  return 62;
}

interface BrandedSplashProps {
  onReady?: () => void;
}

/**
 * Brand intro splash — ivory wordmark over a construction hero scene.
 * Choreography: scene rise + Ken Burns → logo → tagline → soft accent pulse.
 */
export function BrandedSplash({ onReady }: BrandedSplashProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  // Crash-safe defaults: first paint is a finished-looking frame.
  const sceneProgress = useSharedValue(1);
  const sceneScale = useSharedValue(1);
  const logoProgress = useSharedValue(1);
  const taglineProgress = useSharedValue(1);
  const glowPulse = useSharedValue(0.35);
  const barProgress = useSharedValue(0.35);

  useEffect(() => {
    if (reduceMotion) {
      barProgress.value = 1;
      glowPulse.value = 0.45;
      return;
    }

    const easeOut = Easing.out(Easing.cubic);
    const easeInOut = Easing.inOut(Easing.cubic);

    sceneProgress.value = 0;
    sceneScale.value = 1.08;
    logoProgress.value = 0;
    taglineProgress.value = 0;
    glowPulse.value = 0.2;
    barProgress.value = 0;

    sceneProgress.value = withTiming(1, { duration: 780, easing: easeOut });
    sceneScale.value = withTiming(1, { duration: 2400, easing: easeInOut });

    logoProgress.value = withDelay(
      180,
      withTiming(1, { duration: 560, easing: easeOut }),
    );
    taglineProgress.value = withDelay(
      420,
      withTiming(1, { duration: 480, easing: easeOut }),
    );

    glowPulse.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: 1000, easing: easeInOut }),
          withTiming(0.25, { duration: 1000, easing: easeInOut }),
        ),
        -1,
        true,
      ),
    );

    barProgress.value = withDelay(
      300,
      withTiming(1, { duration: 1600, easing: easeInOut }),
    );
  }, [
    reduceMotion,
    sceneProgress,
    sceneScale,
    logoProgress,
    taglineProgress,
    glowPulse,
    barProgress,
  ]);

  const sceneStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      sceneProgress.value,
      [0, 1],
      [0.55, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          sceneProgress.value,
          [0, 1],
          [36, 0],
          Extrapolation.CLAMP,
        ),
      },
      { scale: sceneScale.value },
    ],
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoProgress.value,
    transform: [
      {
        translateY: interpolate(
          logoProgress.value,
          [0, 1],
          [18, 0],
          Extrapolation.CLAMP,
        ),
      },
      {
        scale: interpolate(
          logoProgress.value,
          [0, 1],
          [0.96, 1],
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
          [10, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value * logoProgress.value,
    transform: [
      {
        scale: interpolate(
          glowPulse.value,
          [0.2, 0.55],
          [0.92, 1.08],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${Math.max(barProgress.value * 100, 8)}%`,
    opacity: interpolate(
      taglineProgress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  const bandHeight = sceneHeight(height, insets.top);
  const markHeight = logoHeight(width);

  return (
    <View
      style={[styles.root, { paddingTop: insets.top }]}
      onLayout={() => onReady?.()}
      accessibilityRole="image"
      accessibilityLabel={`${theme.appName}. ${BRAND_SPLASH_TAGLINE}`}>
      <StatusBar style="dark" />

      <View style={styles.brandSection}>
        <Animated.View style={[styles.brandCluster, logoStyle]}>
          <Animated.View pointerEvents="none" style={[styles.logoGlow, glowStyle]} />
          <BrandLogo height={markHeight} variant="onLight" />
        </Animated.View>

        <Animated.View style={taglineStyle}>
          <Text style={styles.tagline}>{BRAND_SPLASH_TAGLINE}</Text>
        </Animated.View>

        <View style={styles.progressTrack} accessibilityElementsHidden>
          <Animated.View style={[styles.progressFill, barStyle]} />
        </View>
      </View>

      <View style={[styles.imageBand, { height: bandHeight }]}>
        <Animated.View style={[StyleSheet.absoluteFill, sceneStyle]}>
          <Image
            source={HERO_IMAGE}
            style={styles.heroImage}
            contentFit="cover"
            contentPosition="bottom center"
            transition={0}
            priority="high"
            accessible={false}
            onError={() => {
              // Keep splash alive even if the hero asset fails to decode.
            }}
          />
        </Animated.View>

        <LinearGradient
          colors={[
            BRAND_IVORY,
            'rgba(252,247,228,0.88)',
            'rgba(252,247,228,0.35)',
            'rgba(252,247,228,0)',
          ]}
          locations={[0, 0.22, 0.55, 1]}
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
  },
  logoGlow: {
    backgroundColor: 'rgba(254,182,35,0.28)',
    borderRadius: 80,
    height: 120,
    position: 'absolute',
    width: 220,
  },
  brandSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 8,
    paddingHorizontal: 28,
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    // Slight overscan so Ken Burns scale never shows edges.
    transform: [{ scale: 1.02 }],
  },
  imageBand: {
    backgroundColor: BRAND_IVORY,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    backgroundColor: theme.primary,
    borderRadius: 2,
    height: '100%',
  },
  progressTrack: {
    backgroundColor: 'rgba(26,26,26,0.08)',
    borderRadius: 2,
    height: 3,
    marginTop: 28,
    overflow: 'hidden',
    width: 88,
  },
  root: {
    backgroundColor: BRAND_IVORY,
    flex: 1,
  },
  skyFade: {
    height: 110,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  tagline: {
    color: theme.black,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 1.35,
    lineHeight: 20,
    marginTop: 16,
    textAlign: 'center',
  },
});
