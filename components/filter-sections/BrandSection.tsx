import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { FILTER_COLORS, FILTER_RADIUS } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

export function BrandSection({ draft, onChange, config }: FilterSectionProps) {
  const [query, setQuery] = useState('');

  const brands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return config.brands;
    return config.brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [config.brands, query]);

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

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 44,
          borderRadius: FILTER_RADIUS.input,
          borderWidth: 1,
          borderColor: FILTER_COLORS.border,
          paddingHorizontal: 12,
          marginBottom: 8,
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

      {brands.length === 0 ? (
        <Text style={{ fontSize: 14, color: FILTER_COLORS.textMuted, paddingVertical: 16 }}>
          No brands found
        </Text>
      ) : (
        brands.map((brand, index) => {
          const selected = draft.brand.includes(brand.name);
          return (
            <View key={brand.id}>
              <ScaledPressable
                onPress={() => toggle(brand.name)}
                scaleTo={0.98}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: FILTER_RADIUS.input,
                    backgroundColor: '#F5F5F5',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '700',
                      color: FILTER_COLORS.textMuted,
                    }}>
                    {brand.logoText ?? brand.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      color: FILTER_COLORS.text,
                      fontWeight: '500',
                    }}>
                    {brand.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: FILTER_COLORS.textMuted,
                      marginTop: 2,
                    }}>
                    {brand.count} {brand.count === 1 ? 'product' : 'products'}
                  </Text>
                </View>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
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
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  ) : null}
                </View>
              </ScaledPressable>
              {index < brands.length - 1 && (
                <View style={{ height: 0.5, backgroundColor: FILTER_COLORS.divider }} />
              )}
            </View>
          );
        })
      )}
    </View>
  );
}
