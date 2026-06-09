import { LayoutAnimation, Platform, Text, UIManager, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, ReactNode } from 'react';

import { ScaledPressable } from '@components/ScaledPressable';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  expanded: boolean;
  onToggle: () => void;
  rightElement?: ReactNode;
  children?: ReactNode;
  onHeaderPress?: () => void;
}

export function CollapsibleSection({
  icon,
  title,
  expanded,
  onToggle,
  rightElement,
  children,
  onHeaderPress,
}: CollapsibleSectionProps) {
  const handlePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (onHeaderPress) onHeaderPress();
    else onToggle();
  };

  return (
    <View className="mb-4 rounded-card border border-border bg-surface">
      <ScaledPressable
        onPress={handlePress}
        className="flex-row items-center justify-between px-4 py-4">
        <View className="flex-row items-center gap-3">
          <Ionicons name={icon} size={20} color="#FEB623" />
          <Text className="text-base font-bold text-text">{title}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          {rightElement}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#666666"
          />
        </View>
      </ScaledPressable>
      {expanded && children && <View className="border-t border-border px-4 pb-4">{children}</View>}
    </View>
  );
}
