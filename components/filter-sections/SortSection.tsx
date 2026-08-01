import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { SORT_OPTIONS } from '@constants/filterOptions';
import { FILTER_COLORS } from '@constants/filterTokens';
import type { FilterSectionProps, SortOption } from '@/types/filter.types';

export function SortSection({ draft, onChange }: FilterSectionProps) {
  const select = (sort: SortOption) => {
    void Haptics.selectionAsync();
    onChange({ ...draft, sort });
  };

  return (
    <View>
      {SORT_OPTIONS.map((option, index) => {
        const selected = draft.sort === option.key;
        return (
          <View key={option.key}>
            <ScaledPressable
              onPress={() => select(option.key)}
              scaleTo={0.98}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 14,
              }}>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: selected ? '600' : '500',
                  color: selected ? FILTER_COLORS.primary : FILTER_COLORS.text,
                }}>
                {option.label}
              </Text>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
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
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: FILTER_COLORS.surface,
                    }}
                  />
                ) : null}
              </View>
            </ScaledPressable>
            {index < SORT_OPTIONS.length - 1 ? (
              <View style={{ height: 0.5, backgroundColor: FILTER_COLORS.divider }} />
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
