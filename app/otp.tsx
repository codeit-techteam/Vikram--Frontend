import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { OTPInput } from '@components/OTPInput';
import { PrimaryButton } from '@components/PrimaryButton';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useAuthStore } from '@store/useAuthStore';
import { safeGoBack } from '@utils/navigation';

function formatPhone(phone: string) {
  if (phone.length === 10) {
    return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
  }
  return `+91 ${phone}`;
}

export default function OTPScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const phoneNumber = useAuthStore((s) => s.phoneNumber);
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(53);
  const [otpValue, setOtpValue] = useState('');

  useEffect(() => {
    if (seconds <= 0) return;
    const interval = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(interval);
  }, [seconds]);

  const formattedTime = `00:${String(seconds).padStart(2, '0')}`;

  const handleVerify = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/role-selection');
    }, 1200);
  };

  const handleResend = () => {
    if (seconds > 0) return;
    setSeconds(53);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled">
          <View className="mb-4 border-b border-border bg-surface px-5 py-3">
            <BrandLogo size="sm" />
          </View>

          <View className="flex-1 items-center justify-center px-5 py-8">
            <View className="w-full max-w-md rounded-card bg-surface p-6 shadow-lg">
              <View className="mb-4 items-center">
                <View className="h-14 w-14 items-center justify-center rounded-xl bg-text">
                  <Ionicons name="cube" size={28} color="#1A73E8" />
                </View>
              </View>

              <Text className="text-center text-xl font-bold text-text">{t('verifyIdentity')}</Text>
              <Text className="mt-2 text-center text-sm text-text-secondary">
                {t('otpSentTo')}{' '}
                <Text className="font-semibold text-text">{formatPhone(phoneNumber)}</Text>
              </Text>

              <Pressable onPress={() => safeGoBack('/login')} className="mt-2 items-center">
                <Text className="text-sm font-medium text-primary">{t('changeNumber')}</Text>
              </Pressable>

              <View className="mt-6">
                <OTPInput onChange={setOtpValue} onComplete={setOtpValue} />
              </View>

              <Pressable
                onPress={handleResend}
                disabled={seconds > 0}
                className="mt-4 items-center">
                <View className="flex-row items-center gap-2 rounded-full bg-timer px-4 py-2">
                  <Ionicons name="time-outline" size={14} color="#FF6B00" />
                  <Text className="text-xs text-text-secondary">
                    {t('resendCodeIn')}{' '}
                    <Text className="font-bold text-primary">{formattedTime}</Text>
                  </Text>
                </View>
              </Pressable>

              <View className="mt-6">
                <PrimaryButton
                  title={t('verifyContinue')}
                  onPress={handleVerify}
                  loading={loading}
                  disabled={otpValue.length < 6}
                  showArrow
                />
              </View>

              <Text className="mt-4 text-center text-[10px] tracking-widest text-text-secondary/60">
                {t('secureEncryption')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
