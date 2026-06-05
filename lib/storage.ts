import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage abstraction layer.
 * Currently backed by AsyncStorage (Expo Go compatible).
 * Swap implementation to MMKV when Dev Build is ready — business logic stays unchanged.
 */
export const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear();
  },

  async getObject<T>(key: string): Promise<T | null> {
    const raw = await storage.getItem(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async setObject<T>(key: string, value: T): Promise<void> {
    await storage.setItem(key, JSON.stringify(value));
  },
};
