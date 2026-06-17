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
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@store/useAuthStore';
import { useLanguageStore, useTranslation, type AppLanguage } from '@store/languageStore';

const GOLD = '#FEB623';
const CREAM = '#FFF4D1';
const DARK = '#1A1A1A';
const WARM_BORDER = '#D4C89A';
const WARM_SHADOW = '#C8900A';
const BLUE = '#1A73E8';
const BLUE_BG = '#EEF2FF';

const inputStyle = {
  borderWidth: 1.5,
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 13,
  fontSize: 15,
  color: DARK,
  backgroundColor: '#FFFFFF',
} as const;

export default function CompleteProfileScreen() {
  const language = useLanguageStore((st) => st.language);
  const setLanguage = useLanguageStore((st) => st.setLanguage);
  const { t } = useTranslation();
  const selectedRole = useAuthStore((st) => st.selectedRole);
  const companyName = useAuthStore((st) => st.companyName);
  const gstNumber = useAuthStore((st) => st.gstNumber);
  const setCompanyName = useAuthStore((st) => st.setCompanyName);
  const setGstNumber = useAuthStore((st) => st.setGstNumber);

  const isIndividual = selectedRole === 'individual';

  const [loading, setLoading] = useState(false);
  const [companyFocused, setCompanyFocused] = useState(false);
  const [gstFocused, setGstFocused] = useState(false);
  const [gstSkipped, setGstSkipped] = useState(false);

  const handleContinue = () => {
    if (loading) return;
    setLoading(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    router.push('/delivery-location' as Href);
    setLoading(false);
  };

  const handleLanguageSelect = (lang: AppLanguage) => {
    setLanguage(lang);
    Haptics.selectionAsync();
  };

  const handleSkipGst = () => {
    setGstNumber('');
    setGstSkipped(true);
    Haptics.selectionAsync();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: GOLD }} edges={['top']}>
      {/* Progress bar */}
      <View style={{ height: 3, backgroundColor: 'rgba(0,0,0,0.12)' }}>
        <View
          style={{
            width: '75%',
            height: '100%',
            backgroundColor: DARK,
            borderRadius: 2,
          }}
        />
      </View>

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

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 110,
        }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled">
        {/* Cream card */}
        <View
          style={{
            backgroundColor: CREAM,
            borderRadius: 20,
            padding: 24,
            shadowColor: WARM_SHADOW,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
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
            {t('completeProfileTitle')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 24,
            }}>
            {t('completeProfileSubtitle')}
          </Text>

          {/* Company Name / Full Name */}
          {!isIndividual ? (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="business-outline" size={15} color="#888" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: DARK }}>
                  {t('companyName')}
                </Text>
              </View>
              <TextInput
                style={{
                  ...inputStyle,
                  borderColor: companyFocused ? GOLD : WARM_BORDER,
                }}
                placeholder={t('companyNamePlaceholder')}
                placeholderTextColor="#BBAA88"
                value={companyName}
                onChangeText={setCompanyName}
                onFocus={() => setCompanyFocused(true)}
                onBlur={() => setCompanyFocused(false)}
              />
            </View>
          ) : (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="person-outline" size={15} color="#888" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: DARK }}>
                  {t('fullName')}
                </Text>
              </View>
              <TextInput
                style={{
                  ...inputStyle,
                  borderColor: companyFocused ? GOLD : WARM_BORDER,
                }}
                placeholder="Enter your full name"
                placeholderTextColor="#BBAA88"
                value={companyName}
                onChangeText={setCompanyName}
                onFocus={() => setCompanyFocused(true)}
                onBlur={() => setCompanyFocused(false)}
              />
            </View>
          )}

          {/* GST Number with Skip */}
          <View style={{ marginBottom: 28 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="shield-outline" size={15} color="#888" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: DARK }}>
                  {t('gstNumber')}
                  <Text style={{ color: '#AAA', fontWeight: '400' }}> ({t('optional')})</Text>
                </Text>
              </View>
              <TouchableOpacity onPress={handleSkipGst}>
                <Text style={{ fontSize: 12, color: GOLD, fontWeight: '700' }}>Skip →</Text>
              </TouchableOpacity>
            </View>

            {isIndividual && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 6,
                  backgroundColor: 'rgba(254,182,35,0.1)',
                  borderRadius: 10,
                  padding: 10,
                  marginBottom: 8,
                }}>
                <Ionicons name="information-circle-outline" size={16} color={GOLD} />
                <Text style={{ flex: 1, fontSize: 12, color: '#666', lineHeight: 17 }}>
                  If you have a GST certificate, add it to unlock Business pricing and GST invoices.
                  You can skip this now and add it later in your profile.
                </Text>
              </View>
            )}

            <TextInput
              style={{
                ...inputStyle,
                borderColor: gstFocused ? GOLD : WARM_BORDER,
                opacity: gstSkipped ? 0.4 : 1,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
              placeholder={t('gstPlaceholder')}
              placeholderTextColor="#BBAA88"
              value={gstNumber}
              onChangeText={(val) => {
                setGstNumber(val);
                setGstSkipped(false);
              }}
              autoCapitalize="characters"
              editable={!gstSkipped}
              onFocus={() => setGstFocused(true)}
              onBlur={() => setGstFocused(false)}
            />

            {gstSkipped && (
              <TouchableOpacity onPress={() => setGstSkipped(false)} style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: GOLD, fontWeight: '600' }}>
                  + Add GST Number
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: WARM_BORDER, marginBottom: 24 }} />

          {/* Language section */}
          <Text style={{ fontSize: 18, fontWeight: '800', color: DARK, marginBottom: 4 }}>
            {t('chooseLanguage')}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 8 }}>
            {t('languageSubtitle')}
          </Text>
          <Text style={{ fontSize: 14, color: GOLD, fontWeight: '700', marginBottom: 12 }}>
            {t('hindiLink')}
          </Text>

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: BLUE_BG,
              alignSelf: 'flex-start',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              marginBottom: 16,
            }}>
            <Ionicons name="location" size={12} color={BLUE} />
            <Text style={{ fontSize: 12, color: BLUE, fontWeight: '600' }}>
              {t('recommendedRegion')}
            </Text>
          </View>

          {/* Language cards */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 28 }}>
            <TouchableOpacity
              onPress={() => handleLanguageSelect('en')}
              activeOpacity={0.85}
              style={{
                flex: 1,
                borderWidth: 2,
                borderColor: language === 'en' ? BLUE : WARM_BORDER,
                borderRadius: 14,
                paddingVertical: 18,
                alignItems: 'center',
                backgroundColor: language === 'en' ? BLUE_BG : 'rgba(255,255,255,0.6)',
              }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor:
                    language === 'en' ? 'rgba(26,115,232,0.1)' : 'rgba(254,182,35,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                <Ionicons
                  name="globe-outline"
                  size={22}
                  color={language === 'en' ? BLUE : GOLD}
                />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: DARK }}>{t('english')}</Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {t('continueInEnglish')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleLanguageSelect('hi')}
              activeOpacity={0.85}
              style={{
                flex: 1,
                borderWidth: 2,
                borderColor: language === 'hi' ? GOLD : WARM_BORDER,
                borderRadius: 14,
                paddingVertical: 18,
                alignItems: 'center',
                backgroundColor:
                  language === 'hi' ? 'rgba(254,182,35,0.15)' : 'rgba(255,255,255,0.6)',
              }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: 'rgba(254,182,35,0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                <Ionicons name="language-outline" size={22} color={GOLD} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '800', color: DARK }}>{t('hindi')}</Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {t('continueInHindi')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ISO badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Ionicons name="shield-checkmark-outline" size={13} color="#AAA" />
            <Text
              style={{
                fontSize: 10,
                color: '#AAA',
                fontWeight: '600',
                letterSpacing: 0.5,
              }}>
              {t('isoSecurity')}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky continue button */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: GOLD,
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 32,
          borderTopWidth: 1,
          borderTopColor: 'rgba(0,0,0,0.08)',
        }}>
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={loading}
          style={{
            backgroundColor: DARK,
            borderRadius: 50,
            paddingVertical: 16,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 10,
            elevation: 8,
            opacity: loading ? 0.85 : 1,
          }}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: '#FFFFFF',
                letterSpacing: 0.2,
              }}>
              {t('continueBtn')} →
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
