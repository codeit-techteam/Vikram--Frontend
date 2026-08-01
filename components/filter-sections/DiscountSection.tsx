import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { DISCOUNT_OPTIONS } from '@constants/filterOptions';
import { FILTER_COLORS, FILTER_RADIUS } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

export function DiscountSection({ draft, onChange }: FilterSectionProps) {
  const select = (value: number | null) => {
    void Haptics.selectionAsync();
    onChange({ ...draft, discount: value });
  };

  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      {DISCOUNT_OPTIONS.map((option) => {
        const selected = draft.discount === option.value;
        return (
          <ScaledPressable
            key={option.label}
            onPress={() => select(option.value)}
            scaleTo={0.95}
            style={{
              height: 36,
              paddingHorizontal: 14,
              borderRadius: FILTER_RADIUS.input,
              backgroundColor: selected ? FILTER_COLORS.primaryLight : '#F5F5F5',
              borderWidth: selected ? 1.5 : 0,
              borderColor: FILTER_COLORS.primaryBorder,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: selected ? FILTER_COLORS.primary : '#333333',
              }}>
              {option.label}
            </Text>
          </ScaledPressable>
        );
      })}
    </View>
  );
}
