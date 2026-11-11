import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { BRAND_CHARCOAL, theme } from '@constants/theme';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  message: string;
  stack: string;
}

/**
 * Shows the full JS crash on screen (release builds included) so the user can
 * share it without ADB. Native crashes are handled by withCrashCatcher.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '', stack: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Unexpected error',
      stack: error?.stack || '(no stack)',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error?.message, info?.componentStack);
    this.setState((prev) => ({
      stack: `${prev.stack}\n\ncomponentStack:${info?.componentStack || ''}`,
    }));
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '', stack: '' });
  };

  private handleShare = async () => {
    const body = `Bajriwala JS crash\n\n${this.state.message}\n\n${this.state.stack}`;
    try {
      await Share.share({ message: body, title: 'Bajriwala crash' });
    } catch {
      // ignore
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const report = `${this.state.message}\n\n${this.state.stack}`;

    return (
      <View style={styles.root}>
        <Text style={styles.title}>
          {this.props.fallbackTitle ?? 'Bajriwala crashed'}
        </Text>
        <Text style={styles.body}>
          Share this report with the developer, then tap Retry.
        </Text>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollInner}>
          <Text selectable style={styles.stack}>
            {report}
          </Text>
        </ScrollView>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            onPress={this.handleShare}
            style={styles.button}>
            <Text style={styles.buttonText}>Share / Copy</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={this.handleRetry}
            style={[styles.button, styles.secondary]}>
            <Text style={styles.buttonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    );
  }
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
