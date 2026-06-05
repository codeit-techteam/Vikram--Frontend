import { strings, type StringKey } from '@constants/strings';
import { useLanguageStore } from '@store/languageStore';

export function useStrings() {
  const language = useLanguageStore((s) => s.language);
  return strings[language];
}

export function useT() {
  const language = useLanguageStore((s) => s.language);
  return (key: StringKey) => strings[language][key];
}
