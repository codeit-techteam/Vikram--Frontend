import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BRAND_CHARCOAL, theme } from '@constants/theme';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

/**
 * Catches render/lifecycle errors so a single bad screen cannot kill the
 * Android process after splash. Does not swallow promise rejections.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message?.slice(0, 180) || 'Unexpected error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error?.message, info?.componentStack);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.root}>
        <Text style={styles.title}>
          {this.props.fallbackTitle ?? 'Something went wrong'}
        </Text>
        <Text style={styles.body}>
          Bajriwala hit an unexpected error. You can retry without reinstalling
          the app.
        </Text>
        {__DEV__ ? <Text style={styles.dev}>{this.state.message}</Text> : null}
        <Pressable
          accessibilityRole="button"
          onPress={this.handleRetry}
          style={styles.button}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_CHARCOAL,
    textAlign: 'center',
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  dev: {
    fontSize: 12,
    color: '#B00020',
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    backgroundColor: theme.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND_CHARCOAL,
  },
});
