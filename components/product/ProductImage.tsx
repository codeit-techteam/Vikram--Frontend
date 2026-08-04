import { memo, useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  type ImageSourcePropType,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image, type ImageContentFit } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ShimmerPlaceholder } from '@components/ui/ShimmerPlaceholder';

const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
const FADE_MS = 220;

export type ProductImageSize = number | 'fill';

export interface ProductImageProps {
  source?: ImageSourcePropType | string | null;
  /** Outer container size. Number = fixed square; `'fill'` = 100% of parent. */
  size?: ProductImageSize;
  /** Inner padding so product never touches edges. */
  padding?: number;
  borderRadius?: number;
  backgroundColor?: string;
  recyclingKey?: string;
  style?: StyleProp<ViewStyle>;
  /** Always defaults to contain — never crop products. */
  contentFit?: ImageContentFit;
  showSkeleton?: boolean;
  showShadow?: boolean;
  accessibilityLabel?: string;
}

function normalizeSource(
  source: ProductImageProps['source'],
): ImageSourcePropType | null {
  if (!source) return null;
  if (typeof source === 'string') {
    const trimmed = source.trim();
    if (!trimmed) return null;
    // Transparent / empty placeholder = treat as missing so we show icon
    if (trimmed.startsWith('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP')) {
      return null;
    }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      if (__DEV__) {
        console.warn('[ProductImage] Non-remote URI ignored:', trimmed);
      }
      return null;
    }
    return { uri: trimmed };
  }
  if (
    typeof source === 'object' &&
    'uri' in source &&
    typeof source.uri === 'string'
  ) {
    const uri = source.uri.trim();
    if (!uri || uri.startsWith('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP')) {
      return null;
    }
    if (!uri.startsWith('http://') && !uri.startsWith('https://')) {
      if (__DEV__) {
        console.warn('[ProductImage] Non-remote URI ignored:', uri);
      }
      return null;
    }
  }
  return source;
}

function ProductImageComponent({
  source,
  size = 'fill',
  padding = 12,
  borderRadius = 12,
  backgroundColor = '#FFFFFF',
  recyclingKey,
  style,
  contentFit = 'contain',
  showSkeleton = true,
  showShadow = false,
  accessibilityLabel = 'Product image',
}: ProductImageProps) {
  const resolved = normalizeSource(source);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const opacity = useSharedValue(0);

  const sourceKey =
    recyclingKey ??
    (typeof source === 'string'
      ? source
      : source && typeof source === 'object' && 'uri' in source
        ? String((source as { uri?: string }).uri ?? '')
        : String(source ?? ''));

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    opacity.value = 0;
  }, [sourceKey, opacity]);

  const onLoad = useCallback(() => {
    setLoaded(true);
    setFailed(false);
    opacity.value = withTiming(1, {
      duration: FADE_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [opacity]);

  const onError = useCallback(() => {
    setFailed(true);
    setLoaded(true);
    opacity.value = withTiming(1, { duration: 120 });
    if (__DEV__) {
      console.warn('[ProductImage] load failed', {
        recyclingKey,
        source:
          typeof source === 'string'
            ? source
            : source && typeof source === 'object' && 'uri' in source
              ? source.uri
              : source,
      });
    }
  }, [opacity, recyclingKey, source]);

  const imageAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const isFixed = typeof size === 'number';
  const containerStyle: StyleProp<ViewStyle> = [
    styles.container,
    {
      borderRadius,
      backgroundColor,
    },
    isFixed ? { width: size, height: size } : styles.fill,
    showShadow ? styles.shadow : null,
    style,
  ];

  if (!resolved || failed) {
    return (
      <View style={containerStyle} accessibilityLabel={accessibilityLabel}>
        <View style={[styles.inner, { margin: padding }]}>
          <View style={styles.placeholder}>
            <Ionicons
              name="image-outline"
              size={isFixed && size < 56 ? 18 : 28}
              color="#BDBDBD"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={containerStyle} accessibilityLabel={accessibilityLabel}>
      <View style={[styles.inner, { margin: padding }]}>
        {showSkeleton && !loaded ? <ShimmerPlaceholder style={styles.skeleton} /> : null}
        <Animated.View style={[styles.imageLayer, imageAnim]}>
          <Image
            source={resolved}
            style={styles.image}
            contentFit={contentFit}
            recyclingKey={recyclingKey}
            cachePolicy="memory-disk"
            placeholder={{ blurhash: DEFAULT_BLURHASH }}
            transition={0}
            onLoad={onLoad}
            onError={onError}
            accessibilityLabel={accessibilityLabel}
          />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    height: '100%',
  },
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  inner: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  imageLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  skeleton: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
  },
  placeholder: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const ProductImage = memo(ProductImageComponent);
