// ============================================================
// SMS Vault v2.0 - Error Boundary
// Captures render-time crashes and shows a recoverable UI.
// ============================================================

import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme, glassCard } from '../utils/theme';
import { logger, log } from '../utils/logger';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    logger.exception('ErrorBoundary', error);
    this.setState({ errorInfo: info });
  }

  handleReload = (): void => {
    // Reset state then bailout to home (caller decides via onReset).
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleRestart = (): void => {
    // Best-effort app restart via dev reload; in a production build, this
    // no-ops cleanly and simply resets the boundary.
    if (__DEV__ && Platform.OS === 'ios') {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const DevSettings = require('react-native/Libraries/Utilities/DevSettings') as {
        reload: () => void;
      };
      DevSettings.reload();
    } else if (__DEV__) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const DevSettings = require('react-native/Libraries/Utilities/DevSettings') as {
        reload: () => void;
      };
      DevSettings.reload();
    } else {
      this.handleReload();
    }
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    const { error } = this.state;

    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[theme.colors.backgroundGradientStart, theme.colors.backgroundGradientEnd]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.iconWrap}>
              <LinearGradient
                colors={[theme.colors.error + '30', theme.colors.error + '10']}
                style={styles.iconGradient}
              >
                <Icon name="warning" size={64} color={theme.colors.error} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.subtitle}>
              SMS Vault hit an unexpected error. Your data is safe — try again.
            </Text>

            {__DEV__ && error && (
              <View style={styles.stackCard}>
                <Text style={styles.stackTitle}>{error.name}: {error.message}</Text>
                {error.stack ? (
                  <Text style={styles.stack} selectable>
                    {error.stack}
                  </Text>
                ) : null}
                {this.state.errorInfo?.componentStack ? (
                  <Text style={styles.stack} selectable>
                    {this.state.errorInfo.componentStack}
                  </Text>
                ) : null}
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={this.handleReload} activeOpacity={0.7}>
                <Icon name="refresh" size={20} color={theme.colors.text} />
                <Text style={styles.secondaryBtnText}>Try Again</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={this.handleRestart} activeOpacity={0.8}>
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.primaryDark]}
                  style={styles.primaryBtnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="reload" size={20} color={theme.colors.white} />
                  <Text style={styles.primaryBtnText}>Reload App</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    paddingVertical: theme.spacing.xxxl,
  },
  iconWrap: { marginBottom: theme.spacing.xl },
  iconGradient: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.glassBorder,
  },
  title: {
    ...theme.typography.displaySmall,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.bodyLarge,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: theme.spacing.xl,
  },
  stackCard: {
    ...glassCard,
    padding: theme.spacing.md,
    width: '100%',
    marginBottom: theme.spacing.xl,
    maxHeight: 220,
  },
  stackTitle: {
    ...theme.typography.labelLarge,
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
  },
  stack: {
    ...theme.typography.caption,
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    color: theme.colors.textTertiary,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  secondaryBtnText: {
    ...theme.typography.labelLarge,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  primaryBtn: { flex: 1, ...theme.shadow.glow },
  primaryBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  primaryBtnText: {
    ...theme.typography.labelLarge,
    color: theme.colors.white,
    marginLeft: theme.spacing.xs,
  },
});

export default ErrorBoundary;
