import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { FILTER_COLORS, FILTER_RADIUS, FILTER_SPACING } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

type BrandSectionProps = FilterSectionProps & {
  /** When provided (full sheet search), hide the local search field. */
  externalSearch?: string;
  hideSearch?: boolean;
};

export function BrandSection({
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
        <Text style={{ fontSize: 14, color: FILTER_COLORS.textMuted, paddingVertical: 16 }}>
          No brands found
        </Text>
      ) : (
        brands.map((brand) => {
          const selected = draft.brand.includes(brand.name);
          const productLabel =
            brand.count === 1 ? '1 Product' : `${brand.count} Products`;
          return (
            <Pressable
              key={brand.id}
              onPress={() => toggle(brand.name)}
              android_ripple={{ color: FILTER_COLORS.primaryLight }}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 64,
                paddingVertical: 12,
                paddingHorizontal: 8,
                marginBottom: 6,
                borderRadius: FILTER_RADIUS.card,
                backgroundColor: selected
                  ? FILTER_COLORS.primaryLight
                  : pressed
                    ? FILTER_COLORS.surfacePressed
                    : FILTER_COLORS.surfaceMuted,
                borderWidth: selected ? 1.5 : 1,
                borderColor: selected ? FILTER_COLORS.primary : 'transparent',
              })}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  backgroundColor: selected ? FILTER_COLORS.primary : '#EEEEEE',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: selected ? '#FFFFFF' : FILTER_COLORS.textMuted,
                  }}>
                  {brand.logoText ?? brand.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={{
                    fontSize: 16,
                    color: FILTER_COLORS.text,
                    fontWeight: selected ? '700' : '600',
                  }}>
                  {brand.name}
                </Text>
                <Text
                  style={{
                    marginTop: 2,
                    fontSize: 13,
                    color: FILTER_COLORS.textMuted,
                    fontWeight: '500',
                  }}>
                  {productLabel}
                </Text>
              </View>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: selected
                    ? FILTER_COLORS.primary
                    : FILTER_COLORS.border,
                  backgroundColor: selected
                    ? FILTER_COLORS.primary
                    : FILTER_COLORS.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {selected ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : null}
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}
