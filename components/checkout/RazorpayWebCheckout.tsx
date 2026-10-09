import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import type { NativeRazorpayOptions } from '@lib/openRazorpayCheckout';
import type { RazorpayCheckoutSuccess } from '@lib/openRazorpayCheckout';

type RazorpayWebCheckoutProps = {
  visible: boolean;
  options: NativeRazorpayOptions | null;
  onSuccess: (result: RazorpayCheckoutSuccess) => void;
  onCancel: () => void;
  onFailure: (message: string) => void;
};

/** Checkout.js must report ready within this window, otherwise we show a retryable error. */
const LOAD_TIMEOUT_MS = 20000;
const ICON_COLOR = '#1A1A1A';
const MUTED_ICON_COLOR = '#999999';
const SECURE_ICON_COLOR = '#2E7D32';

function checkoutHtml(options: NativeRazorpayOptions): string {
  const payload = JSON.stringify(options).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: -apple-system, system-ui, sans-serif; margin: 0; background: #fff; }
    </style>
  </head>
  <body>
    <script>
      function post(message) {
        window.ReactNativeWebView.postMessage(JSON.stringify(message));
      }
      function start() {
        if (typeof Razorpay === 'undefined') {
          post({ type: 'load_error' });
          return;
        }
        var options = ${payload};
        options.handler = function (response) {
          post({ type: 'success', response: response });
        };
        options.modal = {
          ondismiss: function () { post({ type: 'dismiss' }); },
          confirm_close: true
        };
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response) {
          var desc = (response && response.error && response.error.description) || 'Payment failed';
          post({ type: 'failed', description: desc });
        });
        rzp.open();
        post({ type: 'opened' });
      }
    </script>
    <script
      src="https://checkout.razorpay.com/v1/checkout.js"
      onload="start()"
      onerror="post({ type: 'load_error' })"></script>
  </body>
</html>`;
}

function isWebUrl(url: string): boolean {
  return /^(https?:|about:|data:|blob:)/i.test(url);
}

/**
 * Razorpay Standard Checkout (checkout.js) in a WebView. Used only when the native
 * SDK is not linked into the running binary (e.g. Expo Go). The result is still
 * verified by the backend; this component never decides that a payment succeeded.
 */
export function RazorpayWebCheckout({
  visible,
  options,
  onSuccess,
  onCancel,
  onFailure,
}: RazorpayWebCheckoutProps) {
  const html = useMemo(() => (options ? checkoutHtml(options) : ''), [options]);
  const settled = useRef(false);
  const lastFailure = useRef<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!visible) return;
    settled.current = false;
    lastFailure.current = null;
    setOpened(false);
    setLoadError(false);
  }, [visible, options]);

  useEffect(() => {
    if (!visible || opened || loadError) return;
    const timer = setTimeout(() => setLoadError(true), LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [visible, opened, loadError, reloadKey]);

  const close = useCallback(() => {
    if (settled.current) return;
    settled.current = true;
    if (lastFailure.current) {
      onFailure(lastFailure.current);
    } else {
      onCancel();
    }
  }, [onCancel, onFailure]);

  const onMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      if (settled.current) return;
      let payload: {
        type?: string;
        response?: RazorpayCheckoutSuccess;
        description?: string;
      };
      try {
        payload = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }
      switch (payload.type) {
        case 'opened':
          setOpened(true);
          return;
        case 'load_error':
          setLoadError(true);
          return;
        case 'success':
          if (payload.response?.razorpay_payment_id) {
            settled.current = true;
            onSuccess(payload.response);
          }
          return;
        case 'failed':
          // Razorpay keeps its modal open so the customer can retry another method.
          lastFailure.current = payload.description || 'Payment failed';
          return;
        case 'dismiss':
          close();
          return;
        default:
          return;
      }
    },
    [close, onSuccess],
  );

  const onShouldStartLoadWithRequest = useCallback((request: ShouldStartLoadRequest) => {
    if (isWebUrl(request.url)) return true;
    // UPI / wallet intents (upi://, intent://, tez://, phonepe://) belong to other apps.
    void Linking.openURL(request.url).catch(() => {
      lastFailure.current = 'No app found to complete this payment. Try another method.';
    });
    return false;
  }, []);

  if (!visible || !options) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={close}>
      <SafeAreaView className="flex-1 bg-surface" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between border-b border-border px-4 py-2.5">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="lock-closed" size={14} color={SECURE_ICON_COLOR} />
            <Text className="text-sm font-semibold text-text">Secure payment · Razorpay</Text>
          </View>
          <Pressable
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close payment"
            hitSlop={12}>
            <Ionicons name="close" size={24} color={ICON_COLOR} />
          </Pressable>
        </View>

        {loadError ? (
          <View
            accessibilityLiveRegion="polite"
            className="flex-1 items-center justify-center p-6">
            <Ionicons name="cloud-offline-outline" size={40} color={MUTED_ICON_COLOR} />
            <Text className="mt-3 text-base font-semibold text-text">
              Could not load secure checkout
            </Text>
            <Text className="mt-1.5 text-center text-text-secondary">
              Check your internet connection and try again. You have not been charged.
            </Text>
            <Pressable
              onPress={() => {
                setLoadError(false);
                setOpened(false);
                setReloadKey((k) => k + 1);
              }}
              accessibilityRole="button"
              className="mt-5 rounded-pill bg-primary px-6 py-3">
              <Text className="font-bold text-onPrimary">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <WebView
            key={reloadKey}
            originWhitelist={['*']}
            source={{ html }}
            onMessage={onMessage}
            javaScriptEnabled
            domStorageEnabled
            onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
            // Card bank pages open as popups; an unhandled popup renders off-screen on Android.
            // Open them in the browser; the backend reconciles the payment from Razorpay.
            onOpenWindow={(event) => {
              void Linking.openURL(event.nativeEvent.targetUrl).catch(() => undefined);
            }}
            onError={() => setLoadError(true)}
            startInLoadingState
            renderLoading={() => (
              <View className="absolute inset-0 items-center justify-center bg-surface">
                <ActivityIndicator />
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
