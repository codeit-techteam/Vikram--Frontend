import { memo, useEffect } from 'react';
import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import {
  FILTER_COLORS,
  FILTER_RADIUS,
  FILTER_SPACING,
  FILTER_SPRING,
} from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

function TypePill({
  label,
  selected,
  count,
  onToggle,
}: {
  label: string;
  selected: boolean;
  count?: number;
  onToggle: () => void;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      scale.value = withSequence(
        withSpring(1.06, FILTER_SPRING.press),
        withSpring(1, FILTER_SPRING.press),
      );
    }
  }, [selected, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <ScaledPressable
        onPress={onToggle}
        scaleTo={0.96}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={{
          minHeight: 44,
          minWidth: 72,
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: FILTER_RADIUS.pill,
          backgroundColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.surfaceMuted,
          borderWidth: selected ? 0 : 1,
          borderColor: FILTER_COLORS.border,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 6,
        }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '700',
            color: selected ? '#FFFFFF' : FILTER_COLORS.text,
          }}>
          {label}
        </Text>
        {typeof count === 'number' ? (
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: selected ? 'rgba(255,255,255,0.85)' : FILTER_COLORS.textMuted,
            }}>
            {count}
          </Text>
        ) : null}
      </ScaledPressable>
    </Animated.View>
  );
}

export const ProductTypeSection = memo(function ProductTypeSection({
  draft,
  onChange,
  config,
  facetCounts,
}: FilterSectionProps) {
  const toggle = (productType: string) => {
    void Haptics.selectionAsync();
    const exists = draft.productType.includes(productType);
    onChange({
      ...draft,
      productType: exists
        ? draft.productType.filter((t) => t !== productType)
        : [...draft.productType, productType],
    });
  };

  if (config.productTypes.length === 0) {
    return (
      <View style={{ paddingVertical: 32, paddingHorizontal: 8 }}>
        <Text
          style={{
            fontSize: 15,
            fontWeight: '600',
            color: FILTER_COLORS.text,
            textAlign: 'center',
            marginBottom: 6,
          }}>
          No types available
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: FILTER_COLORS.textMuted,
            textAlign: 'center',
            lineHeight: 18,
          }}>
          Product types will appear for categories that support them.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: FILTER_COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
          marginBottom: FILTER_SPACING.md,
        }}>
        Select Type
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
        }}>
        {config.productTypes.map((productType) => (
          <TypePill
            key={productType}
            label={productType}
            selected={draft.productType.includes(productType)}
            count={facetCounts?.[productType]}
            onToggle={() => toggle(productType)}
          />
        ))}
      </View>
    </View>
  );
});
