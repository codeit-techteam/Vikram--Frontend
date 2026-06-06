import { Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { FILTER_COLORS, FILTER_RADIUS } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

export function GradeSection({ draft, onChange, config }: FilterSectionProps) {
  const toggle = (grade: string) => {
    void Haptics.selectionAsync();
    const exists = draft.grade.includes(grade);
    onChange({
      ...draft,
      grade: exists ? draft.grade.filter((g) => g !== grade) : [...draft.grade, grade],
    });
  };

  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      {config.grades.map((grade) => {
        const selected = draft.grade.includes(grade);
        return (
          <ScaledPressable
            key={grade}
            onPress={() => toggle(grade)}
            scaleTo={0.95}
            style={{
              height: 36,
              paddingHorizontal: 16,
              borderRadius: FILTER_RADIUS.input,
              backgroundColor: selected ? FILTER_COLORS.primaryLight : '#F5F5F5',
              borderWidth: selected ? 1.5 : 0,
              borderColor: FILTER_COLORS.primaryBorder,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '600',
                color: selected ? FILTER_COLORS.primary : '#333333',
              }}>
              {grade}
            </Text>
          </ScaledPressable>
        );
      })}
    </View>
  );
}
