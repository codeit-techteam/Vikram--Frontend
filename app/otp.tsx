import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { YellowBackHeader } from '@components/BackHeader';
import { BrandLogo } from '@components/BrandLogo';
import { sendOtp } from '@services/auth.api';
import { storage } from '@lib/storage';
import { useAuthStore } from '@store/useAuthStore';
import { customerHasDeliverySites } from '@utils/ensureDeliverySite';
import { maskMobile } from '@utils/maskMobile';
import { navigateToHomeAfterAuth } from '@utils/navigation';
import type { ApiError } from '@/types';

const RETURNING_USER_KEY = '@bajriwala/returning_user';
const DEFAULT_RESEND_SECONDS = 30;

const GOLD = '#FEB623';
const CREAM = '#FFF4D1';
const DARK = '#1A1A1A';
const WARM_SHADOW = '#C8900A';
const WARM_BORDER = '#D4C89A';
const BUTTON_INACTIVE = '#E8DFB8';

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function OTPScreen() {
  const phoneNumber = useAuthStore((s) => s.phoneNumber);
  const loginWithOtp = useAuthStore((s) => s.loginWithOtp);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(DEFAULT_RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const verifyingRef = useRef(false);

  const maskedPhone = useMemo(() => maskMobile(phoneNumber), [phoneNumber]);

  useEffect(() => {
    const timeout = setTimeout(() => inputRefs.current[0]?.focus(), 300);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const applyOtpDigits = (digits: string) => {
    const next = Array.from({ length: 6 }, (_, index) => digits[index] ?? '');
    setOtp(next);
    setErrorMessage(null);

    const focusIndex = Math.min(digits.length, 5);
    if (digits.length >= 6) {
      inputRefs.current[5]?.blur();
    } else {
      inputRefs.current[focusIndex]?.focus();
    }
  };

  const resendOtp = async () => {
    if (timer > 0 || resending || loading) return;

    setErrorMessage(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setResending(true);
    try {
      const result = await sendOtp(phoneNumber);
      setOtp(['', '', '', '', '', '']);
      setTimer(result.resendAvailableIn ?? DEFAULT_RESEND_SECONDS);
      inputRefs.current[0]?.focus();
    } catch (error) {
      const apiErr = error as ApiError;
      setErrorMessage(apiErr?.message ?? 'Unable to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 6 || loading || verifyingRef.current) return;

    verifyingRef.current = true;
    setErrorMessage(null);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const customer = await loginWithOtp(phoneNumber, code);
      await storage.setItem(RETURNING_USER_KEY, 'true');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (customer.isNewCustomer || !customer.roleSelected) {
        router.replace('/role-selection');
      } else if (!customer.profileCompleted) {
        router.replace('/complete-profile');
      } else {
        const hasSites = await customerHasDeliverySites();
        if (!hasSites) {
          router.replace('/delivery-location');
        } else {
          navigateToHomeAfterAuth();
          queueMicrotask(() => useAuthStore.getState().consumePendingAction());
        }
      }
    } catch (error) {
      const apiErr = error as ApiError;
      setErrorMessage(apiErr?.message ?? 'Invalid OTP. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
      verifyingRef.current = false;
    }
  };

  const isComplete = otp.join('').length === 6;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GOLD }} edges={['top', 'bottom']}>
      <YellowBackHeader />

      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}>
        <View
          style={{
            backgroundColor: CREAM,
            borderRadius: 24,
            padding: 28,
            alignItems: 'center',
            shadowColor: WARM_SHADOW,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 10,
          }}>
          <View style={{ marginBottom: 20 }}>
            <BrandLogo height={44} />
          </View>

          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: DARK,
              marginBottom: 8,
              textAlign: 'center',
            }}>
            Verify Your Identity
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: '#555',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 4,
            }}>
            We&apos;ve sent a 6-digit code to{' '}
            <Text style={{ fontWeight: '800', color: DARK }}>
              +91 {maskedPhone}
            </Text>
          </Text>

          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 28 }}>
            <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Change Number</Text>
          </TouchableOpacity>

          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginBottom: 20,
            }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputRefs.current[i] = ref;
                }}
                style={{
                  width: 46,
                  height: 54,
                  borderWidth: 1.5,
                  borderColor: otp[i] ? GOLD : WARM_BORDER,
                  borderRadius: 12,
                  textAlign: 'center',
                  fontSize: 22,
                  fontWeight: '800',
                  color: DARK,
                  backgroundColor: otp[i] ? 'rgba(254,182,35,0.15)' : '#FFFFFF',
                }}
                maxLength={i === 0 ? 6 : 1}
                keyboardType="number-pad"
                textContentType={i === 0 ? 'oneTimeCode' : 'none'}
                autoComplete={i === 0 ? 'sms-otp' : 'off'}
                importantForAutofill={i === 0 ? 'yes' : 'no'}
                value={otp[i]}
                editable={!loading}
                onChangeText={(val) => {
                  const digits = val.replace(/\D/g, '');

                  if (digits.length > 1) {
                    applyOtpDigits(digits.slice(0, 6));
                    return;
                  }

                  const digit = digits.slice(-1);
                  const newOtp = [...otp];
                  newOtp[i] = digit;
                  setOtp(newOtp);
                  setErrorMessage(null);

                  if (digit && i < 5) {
                    inputRefs.current[i + 1]?.focus();
                  }

                  void Haptics.selectionAsync();
                }}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                    const newOtp = [...otp];
                    newOtp[i - 1] = '';
                    setOtp(newOtp);
                    inputRefs.current[i - 1]?.focus();
                  }
                }}
              />
            ))}
          </View>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(254,182,35,0.15)',
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 20,
              marginBottom: 24,
            }}>
            <Ionicons name="time-outline" size={14} color={GOLD} />
            {timer > 0 ? (
              <Text style={{ fontSize: 13, color: '#666' }}>
                Resend OTP in{' '}
                <Text style={{ color: GOLD, fontWeight: '700' }}>
                  {formatCountdown(timer)}
                </Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={resendOtp} disabled={resending || loading}>
                <Text style={{ color: GOLD, fontWeight: '700', fontSize: 13 }}>
                  {resending ? 'Resending…' : 'Resend OTP'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {errorMessage ? (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: 'rgba(255,59,48,0.1)',
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 12,
                marginBottom: 16,
                width: '100%',
              }}>
              <Ionicons name="alert-circle" size={15} color="#FF3B30" />
              <Text style={{ fontSize: 13, color: '#FF3B30', flex: 1 }}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleVerify}
            disabled={!isComplete || loading}
            activeOpacity={0.85}
            style={{
              width: '100%',
              backgroundColor: isComplete ? GOLD : BUTTON_INACTIVE,
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
              marginBottom: 16,
              shadowColor: isComplete ? WARM_SHADOW : 'transparent',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: isComplete ? 8 : 0,
            }}>
            {loading ? (
              <ActivityIndicator color={DARK} size="small" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: isComplete ? DARK : '#AAA',
                  letterSpacing: 0.2,
                }}>
                Verify & Continue →
              </Text>
            )}
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 10,
              color: '#AAA',
              letterSpacing: 1.2,
              fontWeight: '600',
              textAlign: 'center',
            }}>
            {Platform.OS === 'android'
              ? 'SMS AUTOFILL ENABLED WHEN AVAILABLE'
              : 'SECURE OTP VERIFICATION'}
          </Text>
        </View>
      </View>

      <View style={{ height: 40, backgroundColor: GOLD }} />
    </SafeAreaView>
  );
}
