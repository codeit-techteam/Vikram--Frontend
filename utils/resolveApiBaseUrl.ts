import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PATH = '/api/v1';
const BACKEND_PORT = 8000;

function stripPort(host: string): string {
  return host.split(':')[0]?.trim() ?? host;
}

/**
 * Dev API base URL for Expo Go / simulators.
 * Uses Metro's debugger host (same LAN IP as the Mac) so Wi‑Fi IP changes don't break physical devices.
 */
function resolveDevApiBaseUrl(configured?: string): string {
  const debuggerHost =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri ??
    Constants.manifest2?.extra?.expoGo?.debuggerHost;

  if (debuggerHost) {
    const host = stripPort(String(debuggerHost));
    if (host && host !== 'undefined') {
      // Simulator often reports localhost — backend is on the same machine.
      if (host === 'localhost' || host === '127.0.0.1') {
        if (Platform.OS === 'android') {
          return `http://10.0.2.2:${BACKEND_PORT}${API_PATH}`;
        }
        return `http://localhost:${BACKEND_PORT}${API_PATH}`;
      }
      return `http://${host}:${BACKEND_PORT}${API_PATH}`;
    }
  }

  if (Platform.OS === 'android') {
    return configured || `http://10.0.2.2:${BACKEND_PORT}${API_PATH}`;
  }

  return configured || `http://localhost:${BACKEND_PORT}${API_PATH}`;
}

export function resolveApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!__DEV__) {
    return configured || `http://localhost:${BACKEND_PORT}${API_PATH}`;
  }

  return resolveDevApiBaseUrl(configured);
}
