import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { MobileInput, isValidMobileNumber } from '@components/MobileInput';
import { images } from '@constants/images';
import { sendOtp } from '@services/auth.api';
import { useTranslation } from '@store/languageStore';
import { useAuthStore } from '@store/useAuthStore';
import { storage } from '@lib/storage';
import type { ApiError } from '@/types';

const GOLD = '#FEB623';
const CREAM = '#FFF4D1';
const DARK = '#1A1A1A';
const WARM_SHADOW = '#C8900A';
const RETURNING_USER_KEY = '@bajriwala/returning_user';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPhoneError, setShowPhoneError] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const setPhoneNumber = useAuthStore((s) => s.setPhoneNumber);
  const enterGuestMode = useAuthStore((s) => s.enterGuestMode);
  const clearGuestMode = useAuthStore((s) => s.clearGuestMode);
  const isPhoneValid = isValidMobileNumber(phone);

  useEffect(() => {
    storage.getItem(RETURNING_USER_KEY).then((flag) => {
      setIsFirstTime(flag !== 'true');
    });
  }, []);

  const handleLogin = async () => {
    if (!isPhoneValid) {
      setShowPhoneError(true);
      return;
    }

    setApiError(null);
    setLoading(true);

    try {
      await sendOtp(phone);
      await clearGuestMode();
      setPhoneNumber(phone);
      router.push('/otp');
    } catch (error) {
      const apiErr = error as ApiError;
      setApiError(apiErr?.message ?? 'Unable to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    await enterGuestMode();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GOLD }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: GOLD,
            gap: 8,
          }}>
          <BrandLogo height={32} variant="monoDark" />
        </View>

        {/* Hero image */}
        <Image
          source={{ uri: images.loginBanner }}
          style={{ width: '100%', height: 220 }}
          resizeMode="cover"
        />

        {/* Cream card */}
        <View
          style={{
            backgroundColor: CREAM,
            marginHorizontal: 20,
            marginTop: -30,
            borderRadius: 20,
            padding: 24,
            shadowColor: WARM_SHADOW,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.12,
            shadowRadius: 20,
            elevation: 10,
          }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              color: DARK,
              textAlign: 'center',
              letterSpacing: -0.3,
            }}>
            Welcome to Bajriwala
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 21,
              marginBottom: 22,
            }}>
            {isFirstTime
              ? "India's trusted construction materials platform. Enter your mobile to get started."
              : 'Enter your mobile number to manage site logistics and procurement.'}
          </Text>

          <View style={{ marginBottom: 20 }}>
            <MobileInput
              label={t('loginMobileLabel')}
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                if (showPhoneError && isValidMobileNumber(value)) {
                  setShowPhoneError(false);
                }
                if (apiError) setApiError(null);
              }}
              showError={showPhoneError}
            />
            {apiError ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <Ionicons name="alert-circle" size={13} color="#FF3B30" />
                <Text style={{ fontSize: 12, color: '#FF3B30', flex: 1 }}>{apiError}</Text>
              </View>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('loginBtn')}
            style={{
              backgroundColor: GOLD,
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              marginBottom: 10,
              shadowColor: WARM_SHADOW,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isPhoneValid ? 0.35 : 0,
              shadowRadius: 10,
              elevation: isPhoneValid ? 8 : 0,
              opacity: isPhoneValid ? 1 : 0.45,
            }}>
            {loading ? (
              <ActivityIndicator color={DARK} size="small" />
            ) : (
              <>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '800',
                    color: DARK,
                    letterSpacing: 0.2,
                  }}>
                  {t('loginBtn')}
                </Text>
                <Ionicons name="arrow-forward" size={16} color={DARK} />
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={t('skipForNow')}
            style={{
              paddingVertical: 13,
              alignItems: 'center',
              marginBottom: 18,
              borderRadius: 50,
              borderWidth: 1,
              borderColor: 'rgba(26,26,26,0.12)',
            }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: DARK,
                opacity: 0.7,
              }}>
              {t('skipForNow')}
            </Text>
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: 'rgba(254,182,35,0.18)',
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 10,
            }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: GOLD,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="people" size={16} color={DARK} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: DARK }}>Trusted by 500+</Text>
              <Text
                style={{
                  fontSize: 12,
                  color: '#666666',
                  fontWeight: '500',
                  marginTop: 1,
                }}>
                Contractors across Delhi
              </Text>
            </View>
          </View>
        </View>

        {/* Yellow footer */}
        <View
          style={{
            backgroundColor: GOLD,
            paddingTop: 28,
            paddingBottom: 32,
            paddingHorizontal: 16,
            alignItems: 'center',
            gap: 12,
            flex: 1,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}>
            {(
              [
                { key: 'helpCenter' as const, label: t('helpCenter') },
                { key: 'privacyPolicy' as const, label: t('privacyPolicy') },
                { key: 'termsLink' as const, label: t('termsLink') },
              ] as const
            ).map((link) => (
              <TouchableOpacity
                key={link.key}
                onPress={() => router.push('/account/terms' as Href)}
                activeOpacity={0.7}>
                <Text
                  style={{
                    fontSize: 13,
                    color: DARK,
                    fontWeight: '600',
                    opacity: 0.75,
                  }}>
                  {link.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="lock-closed" size={12} color={DARK} />
            <Text
              style={{
                fontSize: 11,
                color: DARK,
                fontWeight: '600',
                opacity: 0.65,
                letterSpacing: 0.3,
              }}>
              ISO 27001 Certified Enterprise Security
            </Text>
          </View>

          <Text
            style={{
              fontSize: 11,
              color: DARK,
              opacity: 0.5,
              textAlign: 'center',
            }}>
            {t('copyrightNotice')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
