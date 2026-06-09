import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { images } from '@constants/images';
import { useTranslation } from '@store/languageStore';
import { useAuthStore } from '@store/useAuthStore';

const GOLD = '#FEB623';
const CREAM = '#FFF4D1';
const DARK = '#1A1A1A';
const WARM_BORDER = '#E8E0C8';
const WARM_SHADOW = '#C8900A';

export default function LoginScreen() {
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const setPhoneNumber = useAuthStore((s) => s.setPhoneNumber);

  const handleLogin = () => {
    setLoading(true);
    setPhoneNumber(phone.replace(/\s/g, ''));
    setTimeout(() => {
      setLoading(false);
      router.push('/otp');
    }, 1200);
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
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: DARK,
              textAlign: 'center',
              marginBottom: 6,
            }}>
            {t('welcomeBack')}
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: '#555555',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 24,
            }}>
            {t('loginSubtitle')}
          </Text>

          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: DARK,
              marginBottom: 8,
            }}>
            {t('loginMobileLabel')}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: phoneFocused ? GOLD : WARM_BORDER,
              marginBottom: 20,
              overflow: 'hidden',
            }}>
            <View
              style={{
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderRightWidth: 1,
                borderRightColor: WARM_BORDER,
              }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: DARK }}>+91</Text>
            </View>

            <TextInput
              style={{
                flex: 1,
                paddingHorizontal: 14,
                paddingVertical: 14,
                fontSize: 15,
                color: DARK,
              }}
              placeholder="98765 43210"
              placeholderTextColor="#BBAA88"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              onFocus={() => setPhoneFocused(true)}
              onBlur={() => setPhoneFocused(false)}
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.85}
            style={{
              backgroundColor: GOLD,
              borderRadius: 50,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              shadowColor: WARM_SHADOW,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 8,
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
