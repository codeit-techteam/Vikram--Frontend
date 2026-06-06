import { LayoutAnimation, Platform, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';
import type { TechSpecItem } from '@/types/catalog';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface TechSpecsGridProps {
  specs: TechSpecItem[];
  expanded: boolean;
  onToggle: () => void;
}

export function TechSpecsGrid({ specs, expanded, onToggle }: TechSpecsGridProps) {
  const { t } = useTranslation();

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  return (
    <View className="mt-5 px-5">
      <ScaledPressable
        onPress={handleToggle}
        className="flex-row items-center justify-between py-2">
        <Text className="text-base font-bold text-text">{t('technicalSpecs')}</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#666666" />
      </ScaledPressable>

      {expanded && (
        <View className="mt-2 flex-row flex-wrap gap-3">
          {specs.map((spec) => (
            <View
              key={spec.label}
              className="w-[47%] rounded-card border border-border bg-background p-3">
              <View className="flex-row items-center gap-1.5">
                <Ionicons
                  name={spec.icon as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color="#FF6B00"
                />
                <Text className="text-[10px] font-semibold tracking-wider text-text-secondary">
                  {spec.label}
                </Text>
              </View>
              <Text className="mt-1.5 text-sm font-bold text-text">{spec.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
