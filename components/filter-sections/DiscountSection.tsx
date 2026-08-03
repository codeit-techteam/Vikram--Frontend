import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { DISCOUNT_OPTIONS } from '@constants/filterOptions';
import { FILTER_COLORS, FILTER_RADIUS } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

export function DiscountSection({
  draft,
  onChange,
  facetCounts,
}: FilterSectionProps) {
  const select = (value: number | null) => {
    void Haptics.selectionAsync();
    onChange({ ...draft, discount: value });
  };

  return (
    <View style={{ gap: 8 }}>
      {DISCOUNT_OPTIONS.map((option) => {
        const selected = draft.discount === option.value;
        const countKey = option.value == null ? 'any' : String(option.value);
        const count = facetCounts?.[countKey];
        return (
          <ScaledPressable
            key={option.label}
            onPress={() => select(option.value)}
            scaleTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              height: 44,
              paddingHorizontal: 14,
              borderRadius: FILTER_RADIUS.input,
              backgroundColor: selected ? FILTER_COLORS.primaryLight : '#F5F5F5',
              borderWidth: selected ? 1.5 : 0,
              borderColor: FILTER_COLORS.primaryBorder,
            }}>
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '600',
                color: selected ? FILTER_COLORS.primary : '#333333',
              }}>
              {option.label}
              {typeof count === 'number' && option.value != null ? (
                <Text style={{ fontWeight: '400', color: FILTER_COLORS.textMuted }}>
                  {' '}
                  ({count})
                </Text>
              ) : null}
            </Text>
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.border,
                backgroundColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {selected ? (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#FFF',
                  }}
                />
              ) : null}
            </View>
          </ScaledPressable>
        );
      })}
    </View>
  );
}
