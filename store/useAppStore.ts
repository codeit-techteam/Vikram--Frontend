import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppState {
  appName: string;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const useAppStore = create<AppState>((set) => ({
  appName: 'Bajriwala',
  themeMode: 'system',
  setThemeMode: (mode) => set({ themeMode: mode }),
}));
