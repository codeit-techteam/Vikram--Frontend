import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { ScaledPressable } from '@components/ScaledPressable';
import type { AppLanguage } from '@store/languageStore';

interface LanguageCardProps {
  lang: AppLanguage;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onSelect: (lang: AppLanguage) => void;
}

export function LanguageCard({
  lang,
  title,
  subtitle,
  icon,
  selected,
  onSelect,
}: LanguageCardProps) {
  return (
    <ScaledPressable
      onPress={() => onSelect(lang)}
      className={`flex-1 items-center rounded-card border-2 px-3 py-5 ${
        selected ? 'border-secondary bg-secondary/5' : 'border-border bg-surface'
      }`}>
      <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-logo">
        <Ionicons name={icon} size={24} color="#FEB623" />
      </View>
      <Text className="text-base font-bold text-text">{title}</Text>
      <Text className="mt-1 text-center text-xs text-text-secondary">{subtitle}</Text>
    </ScaledPressable>
  );
}
