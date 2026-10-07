import { Image } from 'react-native';

import { BRAND_WORDMARK_ASPECT, BrandWordmark, theme } from '@constants/theme';

export type BrandLogoVariant = keyof typeof BrandWordmark;

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  /** Overrides the preset height from `size`. */
  height?: number;
  variant?: BrandLogoVariant;
}

const HEIGHTS = {
  sm: 26,
  md: 32,
  lg: 80,
};

export function BrandLogo({ size = 'md', height, variant = 'onLight' }: BrandLogoProps) {
  const h = height ?? HEIGHTS[size];

  return (
    <Image
      source={BrandWordmark[variant]}
      style={{ height: h, width: h * BRAND_WORDMARK_ASPECT }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={theme.appName}
    />
  );
}
