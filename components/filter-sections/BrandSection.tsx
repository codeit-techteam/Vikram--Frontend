import { memo, useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
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

type BrandSectionProps = FilterSectionProps & {
  /** When provided (full sheet search), hide the local search field. */
  externalSearch?: string;
  hideSearch?: boolean;
};

function BrandCheckbox({ selected }: { selected: boolean }) {
  const scale = useSharedValue(selected ? 1 : 0.85);

  useEffect(() => {
    scale.value = withSpring(selected ? 1 : 0.85, FILTER_SPRING.press);
  }, [selected, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        animStyle,
        {
          width: 26,
          height: 26,
          borderRadius: FILTER_RADIUS.checkbox,
          borderWidth: 2,
          borderColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.border,
          backgroundColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.surface,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      {selected ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}
    </Animated.View>
  );
}

function BrandRow({
  name,
  logoText,
  count,
  selected,
  onToggle,
}: {
  name: string;
  logoText: string;
  count: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const productLabel = count === 1 ? '1 Product' : `${count} Products`;

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${name}, ${productLabel}`}
      android_ripple={{ color: FILTER_COLORS.primaryLight }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 56,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderRadius: FILTER_RADIUS.card,
        backgroundColor: selected
          ? FILTER_COLORS.primaryLight
          : pressed
            ? FILTER_COLORS.surfacePressed
            : FILTER_COLORS.surface,
        borderWidth: selected ? 1.5 : 1,
        borderColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.border,
      })}>
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: selected ? '#FFFFFF' : FILTER_COLORS.textMuted,
          }}>
          {logoText}
        </Text>
      </View>

      <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 15,
            color: FILTER_COLORS.text,
            fontWeight: selected ? '700' : '600',
          }}>
          {name}
        </Text>
        <Text
          numberOfLines={1}
          style={{
            marginTop: 2,
            fontSize: 12,
            color: FILTER_COLORS.textMuted,
            fontWeight: '500',
          }}>
          {productLabel}
        </Text>
      </View>

      <BrandCheckbox selected={selected} />
    </Pressable>
  );
}

export const BrandSection = memo(function BrandSection({
  draft,
  onChange,
  config,
  facetCounts,
  externalSearch,
  hideSearch,
}: BrandSectionProps) {
  const [query, setQuery] = useState('');
  const effectiveQuery = externalSearch ?? query;

  const brands = useMemo(() => {
    const q = effectiveQuery.trim().toLowerCase();
    const list = config.brands.map((b) => ({
      ...b,
      count: facetCounts?.[b.name] ?? b.count,
    }));
    if (!q) return list;
    return list.filter((b) => b.name.toLowerCase().includes(q));
  }, [config.brands, effectiveQuery, facetCounts]);

  const toggle = (brand: string) => {
    void Haptics.selectionAsync();
    const exists = draft.brand.includes(brand);
    onChange({
      ...draft,
      brand: exists
        ? draft.brand.filter((b) => b !== brand)
        : [...draft.brand, brand],
    });
  };

  const showLocalSearch =
    !hideSearch && externalSearch === undefined && config.brands.length > 0;

  return (
    <View style={{ flex: 1 }}>
      {showLocalSearch ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: 44,
            borderRadius: FILTER_RADIUS.input,
            borderWidth: 1,
            borderColor: FILTER_COLORS.border,
            paddingHorizontal: 12,
            marginBottom: FILTER_SPACING.md,
            backgroundColor: FILTER_COLORS.surfaceMuted,
          }}>
          <Ionicons name="search" size={16} color={FILTER_COLORS.textMuted} />
          <BottomSheetTextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search brands"
            placeholderTextColor={FILTER_COLORS.textMuted}
            style={{
              flex: 1,
              marginLeft: 8,
              fontSize: 14,
              color: FILTER_COLORS.text,
              paddingVertical: 0,
            }}
          />
          {query.length > 0 ? (
            <ScaledPressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={FILTER_COLORS.textMuted} />
            </ScaledPressable>
          ) : null}
        </View>
      ) : null}

      {brands.length === 0 ? (
        <Text
          style={{
            fontSize: 14,
            color: FILTER_COLORS.textMuted,
            paddingVertical: 24,
            textAlign: 'center',
          }}>
          No brands found
        </Text>
      ) : (
        brands.map((brand) => (
          <BrandRow
            key={brand.id}
            name={brand.name}
            logoText={brand.logoText ?? brand.name.slice(0, 2).toUpperCase()}
            count={brand.count}
            selected={draft.brand.includes(brand.name)}
            onToggle={() => toggle(brand.name)}
          />
        ))
      )}
    </View>
  );
});
