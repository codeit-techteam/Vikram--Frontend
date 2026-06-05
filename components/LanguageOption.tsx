import { Pressable, Text, View } from 'react-native';

import type { Language } from '@store/useAuthStore';

interface LanguageOptionProps {
  language: Language;
  selected: boolean;
  onSelect: (id: string) => void;
}

export function LanguageOption({ language, selected, onSelect }: LanguageOptionProps) {
  return (
    <Pressable
      onPress={() => onSelect(language.id)}
      className={`mb-2 flex-row items-center justify-between rounded-card border px-4 py-3.5 ${
        selected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
      }`}>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-base font-semibold text-text">{language.name}</Text>
          {language.recommended && (
            <View className="rounded-full bg-primary/10 px-2 py-0.5">
              <Text className="text-[10px] font-medium text-primary">
                Recommended based on region
              </Text>
            </View>
          )}
        </View>
        <Text className="mt-0.5 text-sm text-text-secondary">{language.nativeName}</Text>
      </View>
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
          selected ? 'border-primary bg-primary' : 'border-border'
        }`}>
        {selected && <View className="h-2 w-2 rounded-full bg-surface" />}
      </View>
    </Pressable>
  );
}
