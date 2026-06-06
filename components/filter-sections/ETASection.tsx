import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { FILTER_COLORS, FILTER_RADIUS } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

const ETA_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Same Day': 'flash-outline',
  '90 min': 'bicycle-outline',
  'Next Day': 'calendar-outline',
  '2-3 Days': 'calendar-outline',
};

export function ETASection({ draft, onChange, config }: FilterSectionProps) {
  const select = (eta: string) => {
    void Haptics.selectionAsync();
    onChange({
      ...draft,
      eta: draft.eta === eta ? null : eta,
    });
  };

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {config.etaOptions.map((eta) => {
        const selected = draft.eta === eta;
        const icon = ETA_ICONS[eta] ?? 'time-outline';
        return (
          <ScaledPressable
            key={eta}
            onPress={() => select(eta)}
            scaleTo={0.95}
            style={{
              width: '47%',
              paddingVertical: 14,
              paddingHorizontal: 12,
              borderRadius: FILTER_RADIUS.card,
              backgroundColor: selected ? FILTER_COLORS.primaryLight : FILTER_COLORS.surfaceMuted,
              borderWidth: selected ? 1.5 : 1,
              borderColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.border,
              alignItems: 'center',
              position: 'relative',
            }}>
            {selected && (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: FILTER_COLORS.primary,
                }}
              />
            )}
            <Ionicons
              name={icon}
              size={24}
              color={selected ? FILTER_COLORS.primary : FILTER_COLORS.textMuted}
            />
            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: '600',
                color: selected ? FILTER_COLORS.primary : '#555555',
                textAlign: 'center',
              }}>
              {eta}
            </Text>
          </ScaledPressable>
        );
      })}
    </View>
  );
}
