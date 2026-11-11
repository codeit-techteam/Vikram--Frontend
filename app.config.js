/**
 * Expo config. Secrets come from:
 * - local `.env` (gitignored) for Metro / expo start
 * - EAS project environment variables for cloud builds
 *
 * Never commit Google Maps keys in this file or app.json.
 */
const googleMapsApiKey =
  process.env.GOOGLE_MAPS_API_KEY?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
  '';

/** @type {import('expo/config').ExpoConfig} */
const expoConfig = {
  name: 'Bajriwala',
  slug: 'bajriwala',
  owner: 'vikramsahrawat09s-team',
  version: '1.0.1',
  orientation: 'portrait',
  icon: './assets/icon-ivory.png',
  scheme: 'bajriwala',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.bajriwala.app',
    ...(googleMapsApiKey
      ? {
          config: {
            googleMapsApiKey,
          },
        }
      : {}),
    infoPlist: {
      NSSpeechRecognitionUsageDescription:
        'Allow Bajriwala to use speech recognition for voice search.',
      NSMicrophoneUsageDescription:
        'Allow Bajriwala to use your microphone for voice search.',
      UIBackgroundModes: ['remote-notification'],
    },
  },
  android: {
    package: 'com.bajriwala.app',
    versionCode: 2,
    googleServicesFile: './google-services.json',
    softwareKeyboardLayoutMode: 'resize',
    ...(googleMapsApiKey
      ? {
          config: {
            googleMaps: {
              apiKey: googleMapsApiKey,
            },
          },
        }
      : {}),
    adaptiveIcon: {
      backgroundColor: '#FCF7E4',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background-ivory.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.RECORD_AUDIO',
      'android.permission.POST_NOTIFICATIONS',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    './plugins/withAndroidSplashCrashFix',
    'expo-router',
    'expo-font',
    'expo-secure-store',
    [
      'expo-notifications',
      {
        icon: './assets/android-icon-monochrome.png',
        color: '#FEB623',
        defaultChannel: 'bajriwala-default',
      },
    ],
    [
      'expo-location',
      {
        locationAlwaysAndWhenInUsePermission:
          'Allow Bajriwala to access your location for delivery site setup.',
        locationWhenInUsePermission:
          'Allow Bajriwala to use your location while using the app to set delivery sites.',
      },
    ],
    'expo-build-properties',
    'expo-video',
    'expo-asset',
    [
      'expo-speech-recognition',
      {
        microphonePermission:
          'Allow Bajriwala to use your microphone for voice search.',
        speechRecognitionPermission:
          'Allow Bajriwala to use speech recognition for voice search.',
      },
    ],
    'expo-image',
    'expo-sharing',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 260,
        resizeMode: 'contain',
        backgroundColor: '#FCF7E4',
        dark: {
          image: './assets/images/splash-icon.png',
          backgroundColor: '#FCF7E4',
        },
      },
    ],
    'expo-status-bar',
    [
      'expo-audio',
      {
        microphonePermission:
          'Allow Bajriwala to use your microphone for voice search.',
        recordAudioAndroid: true,
        enableBackgroundRecording: false,
        enableBackgroundPlayback: false,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: '0350eea9-fe5d-4623-b7bd-3d3ddf1ad568',
    },
  },
};

module.exports = () => {
  if (!googleMapsApiKey && process.env.EAS_BUILD === 'true') {
    console.warn(
      '[app.config] GOOGLE_MAPS_API_KEY / EXPO_PUBLIC_GOOGLE_MAPS_API_KEY is missing on EAS. Set it in Expo → Environment variables.',
    );
  }

  return { expo: expoConfig };
};
