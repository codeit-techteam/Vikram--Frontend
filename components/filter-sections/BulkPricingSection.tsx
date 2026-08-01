import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { FILTER_COLORS, FILTER_RADIUS } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

const OPTIONS: { label: string; value: boolean | null }[] = [
  { label: 'Any', value: null },
  { label: 'Has Bulk Pricing', value: true },
  { label: 'No Bulk Pricing', value: false },
];

export function BulkPricingSection({ draft, onChange }: FilterSectionProps) {
  const select = (value: boolean | null) => {
    void Haptics.selectionAsync();
    onChange({ ...draft, bulkPricing: value });
  };

  return (
    <View style={{ gap: 10 }}>
      {OPTIONS.map((option) => {
        const selected = draft.bulkPricing === option.value;
        return (
          <ScaledPressable
            key={option.label}
            onPress={() => select(option.value)}
            scaleTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderRadius: FILTER_RADIUS.card,
              backgroundColor: selected
                ? FILTER_COLORS.primaryLight
                : FILTER_COLORS.surfaceMuted,
              borderWidth: selected ? 1.5 : 1,
              borderColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.border,
            }}>
            <Text
              style={{
                flex: 1,
                fontSize: 14,
                fontWeight: '600',
                color: selected ? FILTER_COLORS.primary : FILTER_COLORS.text,
              }}>
              {option.label}
            </Text>
            {selected ? (
              <Ionicons name="checkmark-circle" size={20} color={FILTER_COLORS.primary} />
            ) : (
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: FILTER_COLORS.border,
                }}
              />
            )}
          </ScaledPressable>
        );
      })}
    </View>
  );
}
