import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { BRAND_CHARCOAL, theme } from '@constants/theme';

const CRASH_KEY = 'bajriwala_last_js_crash';

/**
 * If a previous JS fatal was persisted by installCrashHandlers.js, show it
 * full-screen on the next launch so it can be shared without ADB.
 */
export function JsCrashReportGate({ children }: { children: React.ReactNode }) {
  const [report, setReport] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(CRASH_KEY);
        if (!cancelled && stored) setReport(stored);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) return null;

  if (report) {
    return (
      <View style={styles.root}>
        <Text style={styles.title}>Bajriwala JS crash report</Text>
        <Text style={styles.body}>
          Share this with the developer, then tap Clear & continue.
        </Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>
          <Text selectable style={styles.stack}>
            {report}
          </Text>
        </ScrollView>
        <View style={styles.row}>
          <Pressable
            style={styles.button}
            onPress={() => {
              void Share.share({
                message: `Bajriwala JS crash\n\n${report}`,
                title: 'Bajriwala crash',
              });
            }}>
            <Text style={styles.buttonText}>Share</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.secondary]}
            onPress={() => {
              void AsyncStorage.removeItem(CRASH_KEY).finally(() => setReport(null));
            }}>
            <Text style={styles.buttonText}>Clear & continue</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_CHARCOAL,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textSecondary,
    marginBottom: 12,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F6F6F6',
    borderRadius: 8,
  },
  scrollInner: {
    padding: 12,
  },
  stack: {
    fontSize: 11,
    lineHeight: 16,
    color: '#B00020',
    fontFamily: 'monospace',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  button: {
    flex: 1,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: '#E5E5E5',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_CHARCOAL,
  },
});
