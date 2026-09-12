import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Modal, View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { NativeRazorpayOptions } from '@lib/openRazorpayCheckout';
import type { RazorpayCheckoutSuccess } from '@lib/openRazorpayCheckout';

type RazorpayWebCheckoutProps = {
  visible: boolean;
  options: NativeRazorpayOptions | null;
  onSuccess: (result: RazorpayCheckoutSuccess) => void;
  onCancel: () => void;
  onFailure: (message: string) => void;
};

function checkoutHtml(options: NativeRazorpayOptions): string {
  const payload = JSON.stringify(options);
  return `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <style>
      body { font-family: -apple-system, system-ui, sans-serif; margin: 0; background: #fff; }
    </style>
  </head>
  <body>
    <script>
      var options = ${payload};
      options.handler = function (response) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'success', response: response }));
      };
      options.modal = {
        ondismiss: function () {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'dismiss' }));
        }
      };
      var rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        var desc = (response && response.error && response.error.description) || 'Payment failed';
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'failed', description: desc }));
      });
      rzp.open();
    </script>
  </body>
</html>`;
}

export function RazorpayWebCheckout({
  visible,
  options,
  onSuccess,
  onCancel,
  onFailure,
}: RazorpayWebCheckoutProps) {
  const html = useMemo(() => (options ? checkoutHtml(options) : ''), [options]);
  const settled = useRef(false);

  useEffect(() => {
    if (visible) settled.current = false;
  }, [visible]);

  const onMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      if (settled.current) return;
      try {
        const payload = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          response?: RazorpayCheckoutSuccess;
          description?: string;
        };
        if (payload.type === 'success' && payload.response?.razorpay_payment_id) {
          settled.current = true;
          onSuccess(payload.response);
          return;
        }
        if (payload.type === 'dismiss') {
          settled.current = true;
          onCancel();
          return;
        }
        if (payload.type === 'failed') {
          settled.current = true;
          onFailure(payload.description || 'Payment failed');
        }
      } catch {
        settled.current = true;
        onFailure('Payment could not be completed.');
      }
    },
    [onCancel, onFailure, onSuccess],
  );

  if (!visible || !options) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          onMessage={onMessage}
          startInLoadingState
          renderLoading={() => (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator />
            </View>
          )}
        />
      </View>
    </Modal>
  );
}
