/**
 * Expo app config (replaces app.json).
 *
 * Native Maps keys come from EAS Environment Variables (preview/production).
 * Hardcoded owner + projectId match @vikramsahrawat09s-team/bajriwala.
 */
const EAS_PROJECT_ID = '0350eea9-fe5d-4623-b7bd-3d3ddf1ad568';
const OWNER = 'vikramsahrawat09s-team';

const googleMapsApiKey =
  process.env.GOOGLE_MAPS_API_KEY?.trim() ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ||
  '';

const expoPublicApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || '';
const expoPublicAppEnv = process.env.EXPO_PUBLIC_APP_ENV?.trim() || '';

/** Fail EAS builds loudly instead of shipping a broken APK. */
function assertRequiredEnv() {
  if (process.env.EAS_BUILD !== 'true') return;

  const missing = [];
  if (!googleMapsApiKey) {
    missing.push('GOOGLE_MAPS_API_KEY (or EXPO_PUBLIC_GOOGLE_MAPS_API_KEY)');
  }
  if (!expoPublicApiUrl) missing.push('EXPO_PUBLIC_API_URL');
  if (!expoPublicAppEnv) missing.push('EXPO_PUBLIC_APP_ENV');

  if (missing.length) {
    throw new Error(
      `[app.config] Missing required EAS env for this build: ${missing.join(', ')}. ` +
        `Set them with: eas env:create --environment preview --name NAME --value "..." --visibility plaintext|sensitive`,
    );
  }
}

assertRequiredEnv();

/** @type {import('expo/config').ExpoConfig} */
const expoConfig = {
  name: 'Bajriwala',
  slug: 'bajriwala',
  owner: OWNER,
  version: '1.0.4',
  orientation: 'portrait',
  icon: './assets/icon-ivory.png',
  scheme: 'bajriwala',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.bajriwala.app',
    config: {
      // Always set (assertRequiredEnv guarantees non-empty on EAS).
      googleMapsApiKey,
    },
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
    versionCode: 4,
    googleServicesFile: './google-services.json',
    softwareKeyboardLayoutMode: 'resize',
    config: {
      googleMaps: {
        apiKey: googleMapsApiKey,
      },
    },
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
    // Shows last native crash on next launch (no USB / adb required).
    './plugins/withCrashCatcher',
    // OEM splash exit-handoff mitigation (clear listener only).
    './plugins/withAndroidSplashCrashFix',
    // Prevent FirebaseInitProvider from killing cold start before UI.
    './plugins/withDisableFirebaseInitProvider',
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
      projectId: EAS_PROJECT_ID,
    },
  },
};

module.exports = () => ({ expo: expoConfig });
