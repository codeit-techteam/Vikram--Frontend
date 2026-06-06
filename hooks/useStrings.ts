import { strings, type StringKey } from '@constants/strings';
import { useLanguageStore, useTranslation } from '@store/languageStore';

export { useTranslation };
export type { StringKey };

export function useStrings() {
  const language = useLanguageStore((s) => s.language);
  return strings[language];
}

export function useT() {
  const language = useLanguageStore((s) => s.language);
  const t = useLanguageStore((s) => s.t);
  return { t, language };
}
