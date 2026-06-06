import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { strings, type StringKey } from '@constants/strings';

export type AppLanguage = 'en' | 'hi';

interface LanguageState {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: StringKey) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'en',
      setLanguage: (lang) => set({ language: lang }),
      t: (key: StringKey) => {
        const lang = get().language;
        return strings[lang][key] ?? strings.en[key] ?? key;
      },
    }),
    {
      name: 'bqi-language',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export const useTranslation = () => {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const t = useLanguageStore((s) => s.t);
  return { t, language, setLanguage };
};
