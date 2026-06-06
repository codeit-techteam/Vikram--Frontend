import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { AVAILABILITY_OPTIONS } from '@constants/filterOptions';
import { FILTER_COLORS, FILTER_RADIUS } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

const AVAILABILITY_META: Record<
  string,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  'In Stock': {
    icon: 'checkmark-circle-outline',
    color: FILTER_COLORS.success,
    bg: FILTER_COLORS.successLight,
  },
  'Ready for Dispatch': {
    icon: 'cube-outline',
    color: FILTER_COLORS.info,
    bg: FILTER_COLORS.infoLight,
  },
};

export function AvailabilitySection({ draft, onChange }: FilterSectionProps) {
  const toggle = (type: string) => {
    void Haptics.selectionAsync();
    const exists = draft.availability.includes(type);
    onChange({
      ...draft,
      availability: exists
        ? draft.availability.filter((a) => a !== type)
        : [...draft.availability, type],
    });
  };

  return (
    <View className="flex-row" style={{ gap: 12 }}>
      {AVAILABILITY_OPTIONS.map((option) => {
        const selected = draft.availability.includes(option);
        const meta = AVAILABILITY_META[option];
        return (
          <ScaledPressable
            key={option}
            onPress={() => toggle(option)}
            scaleTo={0.96}
            style={{
              flex: 1,
              padding: 16,
              borderRadius: FILTER_RADIUS.card,
              backgroundColor: selected ? meta.bg : FILTER_COLORS.surfaceMuted,
              borderWidth: selected ? 1.5 : 1,
              borderColor: selected ? meta.color : FILTER_COLORS.border,
            }}>
            {selected && (
              <Ionicons
                name="checkmark"
                size={16}
                color={meta.color}
                style={{ position: 'absolute', top: 10, right: 10 }}
              />
            )}
            <Ionicons name={meta.icon} size={24} color={meta.color} />
            <Text
              style={{
                marginTop: 8,
                fontSize: 13,
                fontWeight: '600',
                color: FILTER_COLORS.text,
              }}>
              {option}
            </Text>
          </ScaledPressable>
        );
      })}
    </View>
  );
}
