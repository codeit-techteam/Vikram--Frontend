import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MobileInput, isValidMobileNumber } from '@components/MobileInput';
import { ScaledPressable } from '@components/ScaledPressable';
import { borderRadius, theme } from '@constants/theme';
import { sendOtp } from '@services/auth.api';
import { useAuthStore } from '@store/useAuthStore';
import type { ApiError } from '@/types';

const DEFAULT_REASON =
  'Verify your mobile number to place orders and track deliveries.';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'navigate-outline', label: 'Live tracking' },
  { icon: 'pricetags-outline', label: 'Bulk pricing' },
  { icon: 'document-text-outline', label: 'GST & invoices' },
];

/**
 * Global bottom sheet shown whenever a protected action requires login
 * (see `requireAuth`/`requireLogin`). Mounted once in `app/_layout.tsx`.
 *
 * Uses `BottomSheetModal` rather than `BottomSheet`: a plain `BottomSheet` stays
 * mounted at `index={-1}` and its backdrop renders full-screen with
 * `pointerEvents: 'auto'` until Reanimated's first animated reaction flips it to
 * `'none'`. On a cold start that leaves an invisible overlay swallowing every
 * touch. A modal is only in the tree while it is presented.
 */
export function LoginRequiredSheet() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const visible = useAuthStore((s) => s.loginSheetVisible);
  const reason = useAuthStore((s) => s.loginSheetReason);
  const hideLoginSheet = useAuthStore((s) => s.hideLoginSheet);
  const setPhoneNumber = useAuthStore((s) => s.setPhoneNumber);
  const clearGuestMode = useAuthStore((s) => s.clearGuestMode);

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPhoneError, setShowPhoneError] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const isPhoneValid = isValidMobileNumber(phone);

  const resetForm = useCallback(() => {
    setPhone('');
    setLoading(false);
    setShowPhoneError(false);
    setApiError(null);
  }, []);

  useEffect(() => {
    if (visible) {
      resetForm();
      sheetRef.current?.present();
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible, resetForm]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.55}
      />
    ),
    [],
  );

  const handleDismiss = useCallback(() => {
    void Haptics.selectionAsync();
    hideLoginSheet();
  }, [hideLoginSheet]);

  const handleLogin = useCallback(async () => {
    if (!isPhoneValid) {
      setShowPhoneError(true);
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setApiError(null);
    setLoading(true);

    try {
      await sendOtp(phone);
      await clearGuestMode();
      setPhoneNumber(phone);
      hideLoginSheet();
      router.push('/otp');
    } catch (error) {
      const apiErr = error as ApiError;
      setApiError(apiErr?.message ?? 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [clearGuestMode, hideLoginSheet, isPhoneValid, phone, setPhoneNumber]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose={!loading}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      backdropComponent={renderBackdrop}
      onDismiss={hideLoginSheet}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={styles.background}>
      <BottomSheetView
        style={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
        <LinearGradient
          colors={['#FFF6D8', theme.bgCard]}
          locations={[0, 1]}
          style={styles.hero}>
          <View style={styles.headerRow}>
            <View style={styles.guestChip}>
              <View style={styles.guestDot} />
              <Text style={styles.guestChipLabel}>Browsing as guest</Text>
            </View>
            <ScaledPressable
              onPress={handleDismiss}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={12}
              style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={theme.darkGray} />
            </ScaledPressable>
          </View>

          <View style={styles.iconRing}>
            <View style={styles.iconCircle}>
              <Ionicons name="phone-portrait-outline" size={26} color={theme.darkGray} />
            </View>
          </View>

          <Text style={styles.title}>Sign in to continue</Text>
          <Text style={styles.subtitle}>{reason || DEFAULT_REASON}</Text>
        </LinearGradient>

        <View style={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <View key={benefit.label} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <Ionicons name={benefit.icon} size={16} color={theme.darkGray} />
              </View>
              <Text style={styles.benefitLabel}>{benefit.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.form}>
          <MobileInput
            label="Mobile Number"
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              if (showPhoneError && isValidMobileNumber(value)) {
                setShowPhoneError(false);
              }
              if (apiError) setApiError(null);
            }}
            showError={showPhoneError}
            InputComponent={BottomSheetTextInput}
          />
          {apiError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={13} color={theme.error} />
              <Text style={styles.errorText}>{apiError}</Text>
            </View>
          ) : null}
        </View>

        <ScaledPressable
          onPress={() => {
            void handleLogin();
          }}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Continue with mobile"
          style={[
            styles.primaryBtn,
            isPhoneValid ? styles.primaryBtnReady : styles.primaryBtnIdle,
          ]}>
          {loading ? (
            <ActivityIndicator color={theme.textOnPrimary} size="small" />
          ) : (
            <>
              <Ionicons name="phone-portrait-outline" size={18} color={theme.textOnPrimary} />
              <Text style={styles.primaryBtnLabel}>Continue with mobile</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.textOnPrimary} />
            </>
          )}
        </ScaledPressable>

        <ScaledPressable
          onPress={handleDismiss}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Continue as guest"
          style={styles.secondaryBtn}>
          <Text style={styles.secondaryBtnLabel}>Continue as guest</Text>
        </ScaledPressable>

        <View style={styles.trustRow}>
          <Ionicons name="time-outline" size={13} color={theme.textMuted} />
          <Text style={styles.trustLabel}>OTP in 30 seconds</Text>
          <Text style={styles.trustDot}>·</Text>
          <Ionicons name="shield-checkmark-outline" size={13} color={theme.textMuted} />
          <Text style={styles.trustLabel}>Number stays private</Text>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: theme.bgCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  benefitIcon: {
    alignItems: 'center',
    backgroundColor: theme.white,
    borderColor: theme.primaryLight,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  benefitItem: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  benefitLabel: {
    color: theme.darkGray,
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  benefits: {
    backgroundColor: theme.primaryUltraLight,
    borderColor: theme.primaryLight,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 18,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: theme.ultraLightGray,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  content: {
    overflow: 'hidden',
    paddingHorizontal: 20,
  },
  errorRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  errorText: {
    color: theme.error,
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  form: {
    marginBottom: 16,
  },
  guestChip: {
    alignItems: 'center',
    backgroundColor: theme.white,
    borderColor: theme.primaryLight,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  guestChipLabel: {
    color: theme.darkGray,
    fontSize: 12,
    fontWeight: '700',
  },
  guestDot: {
    backgroundColor: theme.primary,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  handle: {
    backgroundColor: '#E8D7A0',
    width: 40,
  },
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hero: {
    borderRadius: borderRadius.xl,
    marginBottom: 16,
    marginHorizontal: -4,
    paddingHorizontal: 4,
    paddingTop: 4,
  },
  iconCircle: {
    alignItems: 'center',
    backgroundColor: theme.primary,
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  iconRing: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: theme.primaryLight,
    borderRadius: 36,
    height: 72,
    justifyContent: 'center',
    marginBottom: 14,
    width: 72,
  },
  primaryBtn: {
    alignItems: 'center',
    borderRadius: 50,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
    marginBottom: 8,
  },
  primaryBtnIdle: {
    backgroundColor: theme.primary,
    opacity: 0.45,
  },
  primaryBtnLabel: {
    color: theme.textOnPrimary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  primaryBtnReady: {
    backgroundColor: theme.primary,
    elevation: 6,
    shadowColor: '#C8900A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.32,
    shadowRadius: 8,
  },
  secondaryBtn: {
    alignItems: 'center',
    borderColor: theme.border,
    borderRadius: 50,
    borderWidth: 1,
    justifyContent: 'center',
    marginBottom: 14,
    paddingVertical: 12,
  },
  secondaryBtnLabel: {
    color: theme.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingBottom: 4,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  title: {
    color: theme.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  trustDot: {
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  trustLabel: {
    color: theme.textMuted,
    fontSize: 11.5,
    fontWeight: '600',
  },
  trustRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    paddingBottom: 4,
  },
});
