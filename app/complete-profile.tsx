import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandLogo } from '@components/BrandLogo';
import { LanguageCard } from '@components/LanguageCard';
import { PrimaryButton } from '@components/PrimaryButton';
import { useAuthStore } from '@store/useAuthStore';
import { useLanguageStore, useTranslation, type AppLanguage } from '@store/languageStore';

export default function CompleteProfileScreen() {
  const language = useLanguageStore((st) => st.language);
  const setLanguage = useLanguageStore((st) => st.setLanguage);
  const { t } = useTranslation();
  const companyName = useAuthStore((st) => st.companyName);
  const gstNumber = useAuthStore((st) => st.gstNumber);
  const setCompanyName = useAuthStore((st) => st.setCompanyName);
  const setGstNumber = useAuthStore((st) => st.setGstNumber);

  const [loading, setLoading] = useState(false);

  const handleContinue = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push('/delivery-location' as Href);
    }, 800);
  };

  const handleLanguageSelect = (lang: AppLanguage) => {
    setLanguage(lang);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <View className="h-1 bg-primary" />

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="mb-4 bg-surface px-5 py-3">
          <BrandLogo size="sm" />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-5 pb-6 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="rounded-card bg-surface p-5 shadow-sm">
            <Text className="text-center text-xl font-bold text-text">
              {t('completeProfileTitle')}
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-text-secondary">
              {t('completeProfileSubtitle')}
            </Text>

            <View className="mt-6 flex-row items-center gap-2">
              <Ionicons name="business-outline" size={16} color="#666666" />
              <Text className="text-sm text-text-secondary">{t('companyName')}</Text>
            </View>
            <TextInput
              value={companyName}
              onChangeText={setCompanyName}
              placeholder={t('companyNamePlaceholder')}
              placeholderTextColor="#999999"
              className="mt-2 rounded-input border border-border bg-surface px-4 py-3.5 text-base text-text"
            />

            <View className="mt-5 flex-row items-center gap-2">
              <Ionicons name="shield-checkmark-outline" size={16} color="#666666" />
              <Text className="text-sm text-text-secondary">{t('gstNumber')}</Text>
            </View>
            <TextInput
              value={gstNumber}
              onChangeText={setGstNumber}
              placeholder={t('gstPlaceholder')}
              placeholderTextColor="#999999"
              autoCapitalize="characters"
              className="mt-2 rounded-input border border-border bg-surface px-4 py-3.5 text-base text-text"
            />

            <Text className="mt-8 text-base font-bold text-text">{t('chooseLanguage')}</Text>
            <Text className="mt-1 text-sm text-text-secondary">{t('languageSubtitle')}</Text>
            <Text className="mt-2 text-sm font-medium text-primary">{t('hindiLink')}</Text>

            <View className="mt-3 flex-row items-center gap-2 self-start rounded-full bg-timer px-3 py-1.5">
              <Ionicons name="location" size={12} color="#1A73E8" />
              <Text className="text-xs font-medium text-secondary">{t('recommendedRegion')}</Text>
            </View>

            <View className="mt-4 flex-row gap-3">
              <LanguageCard
                lang="en"
                title={t('english')}
                subtitle={t('continueInEnglish')}
                icon="globe-outline"
                selected={language === 'en'}
                onSelect={handleLanguageSelect}
              />
              <LanguageCard
                lang="hi"
                title={t('hindi')}
                subtitle={t('continueInHindi')}
                icon="language-outline"
                selected={language === 'hi'}
                onSelect={handleLanguageSelect}
              />
            </View>
          </View>

          <View className="mt-6 flex-row items-center justify-center gap-1.5">
            <Ionicons name="shield-checkmark-outline" size={12} color="#666666" />
            <Text className="text-[10px] tracking-wider text-text-secondary">{t('isoSecurity')}</Text>
          </View>
        </ScrollView>

        <View className="border-t border-border bg-surface px-5 py-4">
          <PrimaryButton
            title={t('continueBtn')}
            onPress={handleContinue}
            loading={loading}
            showArrow
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
