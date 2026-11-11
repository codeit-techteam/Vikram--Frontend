/**
 * Instant "keeps stopping" with no UI often means a ContentProvider crash
 * BEFORE Application.onCreate (our crash catcher never runs).
 *
 * expo-notifications + google-services.json injects FirebaseInitProvider.
 * This plugin removes that provider so a bad Firebase/FCM init cannot kill
 * cold start. Push token registration still fails softly in JS.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

function withDisableFirebaseInitProvider(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0];
    if (!app) return cfg;

    const providers = app.provider || [];
    const before = providers.length;
    app.provider = providers.filter((p) => {
      const name = p.$?.['android:name'] || '';
      return !name.includes('FirebaseInitProvider');
    });

    // Also ensure tools:node remove for any merge leftovers.
    const manifest = cfg.modResults.manifest;
    if (!manifest.$) manifest.$ = {};
    if (!manifest.$['xmlns:tools']) {
      manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    }

    app.provider = app.provider || [];
    const already = app.provider.some(
      (p) => p.$?.['android:name'] === 'com.google.firebase.provider.FirebaseInitProvider',
    );
    if (!already) {
      app.provider.push({
        $: {
          'android:name': 'com.google.firebase.provider.FirebaseInitProvider',
          'tools:node': 'remove',
        },
      });
    }

    console.log(
      `[withDisableFirebaseInitProvider] filtered ${before - (app.provider.length - 1)} providers; tools:node=remove applied`,
    );
    return cfg;
  });
}

module.exports = withDisableFirebaseInitProvider;
