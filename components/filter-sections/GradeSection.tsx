import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { FILTER_COLORS, FILTER_RADIUS, FILTER_SPACING } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

export function GradeSection({
  draft,
  onChange,
  config,
  facetCounts,
}: FilterSectionProps) {
  const toggle = (grade: string) => {
    void Haptics.selectionAsync();
    const exists = draft.grade.includes(grade);
    onChange({
      ...draft,
      grade: exists ? draft.grade.filter((g) => g !== grade) : [...draft.grade, grade],
    });
  };

  if (config.grades.length === 0) {
    return (
      <Text style={{ fontSize: 14, color: FILTER_COLORS.textMuted, paddingVertical: 16 }}>
        No grades available
      </Text>
    );
  }

  return (
    <View>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: FILTER_COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          marginBottom: FILTER_SPACING.md,
        }}>
        Select Grade
      </Text>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 10,
        }}>
        {config.grades.map((grade) => {
          const selected = draft.grade.includes(grade);
          const count = facetCounts?.[grade];
          return (
            <ScaledPressable
              key={grade}
              onPress={() => toggle(grade)}
              scaleTo={0.96}
              style={{
                minHeight: 44,
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderRadius: FILTER_RADIUS.chip + 4,
                backgroundColor: selected
                  ? FILTER_COLORS.primary
                  : FILTER_COLORS.surfaceMuted,
                borderWidth: selected ? 0 : 1,
                borderColor: FILTER_COLORS.border,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: selected ? '#FFFFFF' : FILTER_COLORS.text,
                }}>
                {grade}
              </Text>
              {typeof count === 'number' ? (
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: selected ? 'rgba(255,255,255,0.85)' : FILTER_COLORS.textMuted,
                  }}>
                  {count}
                </Text>
              ) : null}
            </ScaledPressable>
          );
        })}
      </View>
    </View>
  );
}
