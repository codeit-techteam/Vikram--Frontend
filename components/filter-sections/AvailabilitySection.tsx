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
  'Limited Stock': {
    icon: 'alert-circle-outline',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  'Out of Stock': {
    icon: 'close-circle-outline',
    color: '#EF4444',
    bg: '#FEF2F2',
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
    <View style={{ gap: 10 }}>
      {AVAILABILITY_OPTIONS.map((option) => {
        const selected = draft.availability.includes(option);
        const meta = AVAILABILITY_META[option];
        return (
          <ScaledPressable
            key={option}
            onPress={() => toggle(option)}
            scaleTo={0.98}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 14,
              paddingHorizontal: 14,
              borderRadius: FILTER_RADIUS.card,
              backgroundColor: selected ? meta.bg : FILTER_COLORS.surfaceMuted,
              borderWidth: selected ? 1.5 : 1,
              borderColor: selected ? meta.color : FILTER_COLORS.border,
            }}>
            <Ionicons name={meta.icon} size={22} color={meta.color} />
            <Text
              style={{
                flex: 1,
                marginLeft: 12,
                fontSize: 14,
                fontWeight: '600',
                color: FILTER_COLORS.text,
              }}>
              {option}
            </Text>
            <View
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                borderWidth: 2,
                borderColor: selected ? meta.color : FILTER_COLORS.border,
                backgroundColor: selected ? meta.color : FILTER_COLORS.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {selected ? (
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              ) : null}
            </View>
          </ScaledPressable>
        );
      })}
    </View>
  );
}
