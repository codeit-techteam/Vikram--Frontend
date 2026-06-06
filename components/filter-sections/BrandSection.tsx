import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { FILTER_COLORS, FILTER_RADIUS } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

export function BrandSection({ draft, onChange, config }: FilterSectionProps) {
  const select = (brand: string) => {
    void Haptics.selectionAsync();
    onChange({
      ...draft,
      brand: draft.brand === brand ? null : brand,
    });
  };

  return (
    <View>
      {config.brands.map((brand, index) => {
        const selected = draft.brand === brand.name;
        return (
          <View key={brand.id}>
            <ScaledPressable
              onPress={() => select(brand.name)}
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
                <Text style={{ fontSize: 12, fontWeight: '700', color: FILTER_COLORS.textMuted }}>
                  {brand.logoText ?? brand.name.slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontSize: 15, color: FILTER_COLORS.text, fontWeight: '500' }}>
                  {brand.name}
                </Text>
                <Text style={{ fontSize: 12, color: FILTER_COLORS.textMuted, marginTop: 2 }}>
                  {brand.count} {brand.count === 1 ? 'product' : 'products'}
                </Text>
              </View>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.border,
                  backgroundColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                {selected && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: FILTER_COLORS.surface,
                    }}
                  />
                )}
              </View>
            </ScaledPressable>
            {index < config.brands.length - 1 && (
              <View style={{ height: 0.5, backgroundColor: FILTER_COLORS.divider }} />
            )}
          </View>
        );
      })}
    </View>
  );
}
