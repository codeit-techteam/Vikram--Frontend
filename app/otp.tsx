import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import { sendOtp } from '@services/auth.api';
import { storage } from '@lib/storage';
import { useAuthStore } from '@store/useAuthStore';
import type { ApiError } from '@/types';

const RETURNING_USER_KEY = '@bajriwala/returning_user';

const GOLD = '#FEB623';
const CREAM = '#FFF4D1';
const DARK = '#1A1A1A';
const WARM_SHADOW = '#C8900A';
const WARM_BORDER = '#D4C89A';
const BUTTON_INACTIVE = '#E8DFB8';

export default function OTPScreen() {
  const phoneNumber = useAuthStore((s) => s.phoneNumber);
  const loginWithOtp = useAuthStore((s) => s.loginWithOtp);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = Array(6)
    .fill(null)
    .map(() => useRef<TextInput>(null));

  useEffect(() => {
    const timeout = setTimeout(() => inputRefs[0].current?.focus(), 300);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const resendOtp = async () => {
    setOtp(['', '', '', '', '', '']);
    setTimer(60);
    setErrorMessage(null);
    inputRefs[0].current?.focus();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setResending(true);
    try {
      await sendOtp(phoneNumber);
    } catch (error) {
      const apiErr = error as ApiError;
      setErrorMessage(apiErr?.message ?? 'Unable to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleVerify = async () => {
    if (otp.join('').length < 6 || loading) return;

    setErrorMessage(null);
    setLoading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const customer = await loginWithOtp(phoneNumber, otp.join(''));
      await storage.setItem(RETURNING_USER_KEY, 'true');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (customer.isNewCustomer || !customer.roleSelected) {
        router.replace('/role-selection');
      } else if (!customer.profileCompleted) {
        router.replace('/complete-profile');
      } else {
        router.replace('/(tabs)');
        // Re-run whatever protected action prompted this login (e.g. add-to-cart, checkout).
        useAuthStore.getState().consumePendingAction();
      }
    } catch (error) {
      const apiErr = error as ApiError;
      setErrorMessage(apiErr?.message ?? 'Invalid OTP. Please try again.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const isComplete = otp.join('').length === 6;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GOLD }} edges={['top', 'bottom']}>
      <YellowBackHeader />

      {/* Center content */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          paddingHorizontal: 20,
        }}>
        {/* Cream card */}
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
          {/* Logo */}
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              backgroundColor: GOLD,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
              shadowColor: WARM_SHADOW,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
            }}>
            <Image
              source={require('../assets/images/logo.png')}
              style={{ width: 50, height: 50 }}
              resizeMode="contain"
            />
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
            <Text style={{ fontWeight: '800', color: DARK }}>+91 {phoneNumber}</Text>
          </Text>

          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 28 }}>
            <Text style={{ color: GOLD, fontSize: 14, fontWeight: '700' }}>Change Number</Text>
          </TouchableOpacity>

          {/* OTP inputs */}
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              marginBottom: 20,
            }}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <TextInput
                key={i}
                ref={inputRefs[i]}
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
                maxLength={1}
                keyboardType="number-pad"
                value={otp[i]}
                onChangeText={(val) => {
                  const digit = val.replace(/\D/g, '').slice(-1);
                  const newOtp = [...otp];
                  newOtp[i] = digit;
                  setOtp(newOtp);
                  if (digit && i < 5) {
                    inputRefs[i + 1].current?.focus();
                  }
                  Haptics.selectionAsync();
                }}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !otp[i] && i > 0) {
                    inputRefs[i - 1].current?.focus();
                  }
                }}
              />
            ))}
          </View>

          {/* Resend timer */}
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
                Resend code in{' '}
                <Text style={{ color: GOLD, fontWeight: '700' }}>
                  {String(Math.floor(timer / 60)).padStart(2, '0')}:
                  {String(timer % 60).padStart(2, '0')}
                </Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={resendOtp} disabled={resending}>
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

          {/* Verify button */}
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
            SECURE 256-BIT AES ENCRYPTION
          </Text>
        </View>
      </View>

      {/* Bottom spacer */}
      <View style={{ height: 40, backgroundColor: GOLD }} />
    </SafeAreaView>
  );
}
