import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MobileInput, isValidMobileNumber } from '@components/MobileInput';
import { images } from '@constants/images';
import { useTranslation } from '@store/languageStore';
import { useAuthStore } from '@store/useAuthStore';
import { storage } from '@lib/storage';

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

    setLoading(true);
    await clearGuestMode();
    setPhoneNumber(phone);
    setTimeout(() => {
      setLoading(false);
      router.push('/otp');
    }, 1200);
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
          <Image
            source={require('../assets/images/logo.png')}
            style={{ width: 30, height: 30, borderRadius: 6 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 17, fontWeight: '800', color: DARK }}>Bajriwala</Text>
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
          {isFirstTime ? (
            <>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: DARK,
                  textAlign: 'center',
                }}>
                Welcome to Bajriwala
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#666',
                  textAlign: 'center',
                  marginTop: 6,
                  lineHeight: 20,
                  marginBottom: 24,
                }}>
                India's trusted construction materials platform. Enter your mobile to get started.
              </Text>
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: '800',
                  color: DARK,
                  textAlign: 'center',
                }}>
                Welcome to Bajriwala
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: '#666',
                  textAlign: 'center',
                  marginTop: 6,
                  lineHeight: 20,
                  marginBottom: 24,
                }}>
                Enter your mobile number to manage site logistics and procurement.
              </Text>
            </>
          )}

          <View style={{ marginBottom: 20 }}>
            <MobileInput
              label={t('loginMobileLabel')}
              value={phone}
              onChangeText={(value) => {
                setPhone(value);
                if (showPhoneError && isValidMobileNumber(value)) {
                  setShowPhoneError(false);
                }
              }}
              showError={showPhoneError}
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={!isPhoneValid || loading}
            activeOpacity={0.85}
            style={{
              backgroundColor: isPhoneValid ? GOLD : '#E0D5B8',
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              shadowColor: WARM_SHADOW,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isPhoneValid ? 0.35 : 0,
              shadowRadius: 10,
              elevation: isPhoneValid ? 8 : 0,
              opacity: isPhoneValid ? 1 : 0.7,
            }}>
            {loading ? (
              <ActivityIndicator color={DARK} size="small" />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: DARK,
                  letterSpacing: 0.2,
                }}>
                {t('loginBtn')}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            activeOpacity={0.7}
            style={{
              paddingVertical: 12,
              alignItems: 'center',
              marginBottom: 16,
            }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: DARK,
                opacity: 0.75,
              }}>
              {t('skipForNow')}
            </Text>
          </TouchableOpacity>

          <View
            style={{
              backgroundColor: 'rgba(254,182,35,0.15)',
              borderRadius: 12,
              paddingVertical: 12,
              paddingHorizontal: 16,
              alignItems: 'center',
            }}>
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
              <TouchableOpacity key={link.key} onPress={() => {}} activeOpacity={0.7}>
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
