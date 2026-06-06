import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { PrimaryButton } from '@components/PrimaryButton';
import { images } from '@constants/images';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useAuthStore } from '@store/useAuthStore';

export default function LoginScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const [phone, setPhone] = useState('98765 43210');
  const [loading, setLoading] = useState(false);
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
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="mb-4 bg-surface px-5 pb-3 pt-2">
            <BrandLogo size="sm" />
          </View>

          <Image
            source={{ uri: images.loginBanner }}
            style={{ width: '100%', height: 200 }}
            contentFit="cover"
          />

          <View className="mx-5 -mt-10 rounded-card bg-surface p-6 shadow-lg">
            <Text className="text-xl font-bold text-text">{t('welcomeBack')}</Text>
            <Text className="mt-2 text-sm leading-5 text-text-secondary">{t('loginSubtitle')}</Text>

            <Text className="mb-2 mt-6 text-sm text-text-secondary">{t('loginMobileLabel')}</Text>
            <View className="flex-row items-center rounded-input border border-border bg-input px-3">
              <Text className="text-base font-medium text-text">+91</Text>
              <View className="mx-3 h-6 w-px bg-border" />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="98765 43210"
                placeholderTextColor="#999999"
                className="flex-1 py-3.5 text-base text-text"
              />
            </View>

            <View className="mt-6">
              <PrimaryButton title={t('loginBtn')} onPress={handleLogin} loading={loading} />
            </View>

            <View className="mt-6 flex-row items-center rounded-card bg-trust p-4">
              <View className="flex-row">
                {[
                  { initials: 'RK', bg: '#1A73E8' },
                  { initials: 'AS', bg: '#FF6B00' },
                  { initials: 'MK', bg: '#8D6E63' },
                ].map((avatar, i) => (
                  <View
                    key={avatar.initials}
                    className="h-9 w-9 items-center justify-center rounded-full border-2 border-surface"
                    style={{
                      backgroundColor: avatar.bg,
                      marginLeft: i > 0 ? -10 : 0,
                      zIndex: 3 - i,
                    }}>
                    <Text className="text-xs font-bold text-text-inverse">{avatar.initials}</Text>
                  </View>
                ))}
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-bold text-text">{t('trustedBy')}</Text>
                <Text className="text-xs text-text-secondary">{t('contractorsIndia')}</Text>
              </View>
            </View>
          </View>

          <View className="mt-8 items-center px-5 pb-4">
            <View className="flex-row gap-6">
              {(
                [
                  { key: 'helpCenter' as const, label: t('helpCenter') },
                  { key: 'privacyPolicy' as const, label: t('privacyPolicy') },
                  { key: 'termsLink' as const, label: t('termsLink') },
                ] as const
              ).map((link) => (
                <Pressable key={link.key}>
                  <Text className="text-xs text-text-secondary">{link.label}</Text>
                </Pressable>
              ))}
            </View>

            <View className="mt-4 flex-row items-center gap-1.5">
              <Ionicons name="lock-closed-outline" size={12} color="#666666" />
              <Text className="text-[10px] text-text-secondary">{t('isoSecurity')}</Text>
            </View>

            <Text className="mt-3 text-center text-[10px] text-text-secondary/70">
              {t('copyrightNotice')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
