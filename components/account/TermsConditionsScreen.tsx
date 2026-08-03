import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Linking,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { ScaledPressable } from '@components/ScaledPressable';
import { Accordion } from '@components/ui/Accordion';
import { colors } from '@constants/colors';
import { TERMS_META, TERMS_SECTIONS, TERMS_STORAGE_KEY } from '@constants/terms';
import { storage } from '@lib/storage';
import { useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';

function BulletList({ items }: { items: string[] }) {
  return (
    <View className="gap-2.5">
      {items.map((item) => (
        <View key={item} className="flex-row items-start gap-2.5">
          <View className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
          <Text className="flex-1 text-[13px] leading-5 text-text-secondary">{item}</Text>
        </View>
      ))}
    </View>
  );
}

function DetailRows({
  details,
}: {
  details: { label: string; value: string }[];
}) {
  return (
    <View className="gap-3">
      {details.map((row) => (
        <View key={row.label}>
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            {row.label}
          </Text>
          <Text className="mt-0.5 text-[14px] font-semibold text-text">{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

export default function TermsConditionsScreen() {
  const { t } = useTranslation();
  const [openId, setOpenId] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const value = await storage.getItem(TERMS_STORAGE_KEY);
      if (mounted) {
        if (value === '1') {
          setAccepted(true);
          setChecked(true);
        }
        setHydrated(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const accordionItems = useMemo(
    () =>
      TERMS_SECTIONS.map((section) => ({
        id: section.id,
        title: section.title,
        content: section.details ? (
          <DetailRows details={section.details} />
        ) : (
          <BulletList items={section.bullets ?? []} />
        ),
      })),
    [],
  );

  const handleAccept = useCallback(async () => {
    if (!checked || accepted) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await storage.setItem(TERMS_STORAGE_KEY, '1');
    setAccepted(true);
  }, [accepted, checked]);

  const toggleChecked = useCallback(() => {
    if (accepted) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChecked((prev) => !prev);
  }, [accepted]);

  const openSupport = useCallback(() => {
    router.push('/support');
  }, []);

  const openEmail = useCallback(() => {
    Linking.openURL(`mailto:${TERMS_META.supportEmail}`).catch(() => undefined);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <BackHeader
        title={t('termsConditions')}
        onBack={() => safeGoBack('/(tabs)/account')}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Top information card */}
        <View className="mb-6 rounded-card border border-border bg-surface p-5">
          <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
            <Text className="text-2xl">📄</Text>
          </View>
          <Text className="text-lg font-bold text-text">{TERMS_META.title}</Text>
          <Text className="mt-1.5 text-xs font-medium text-text-secondary">
            {t('termsLastUpdated')} {TERMS_META.lastUpdated}
          </Text>
          <Text className="mt-3 text-[13px] leading-5 text-text-secondary">
            {TERMS_META.intro}
          </Text>
        </View>

        {/* Accordion sections */}
        <Text className="mb-3 text-xs font-bold uppercase tracking-wider text-text-secondary">
          {t('termsSectionsLabel')}
        </Text>
        <Accordion openId={openId} onChange={setOpenId} items={accordionItems} />

        {/* Help card */}
        <View className="mt-3 mb-2 rounded-card border border-border bg-surface p-5">
          <View className="mb-3 h-11 w-11 items-center justify-center rounded-full bg-info/10">
            <Ionicons name="headset-outline" size={22} color={colors.secondary} />
          </View>
          <Text className="text-base font-bold text-text">{t('termsNeedHelp')}</Text>
          <Text className="mt-1 text-[13px] text-text-secondary">
            {t('termsContactSupportDesc')}
          </Text>

          <ScaledPressable
            onPress={openSupport}
            className="mt-4 h-12 items-center justify-center rounded-pill bg-primary">
            <Text className="text-[15px] font-bold text-text">{t('contactSupport')}</Text>
          </ScaledPressable>

          <ScaledPressable
            onPress={openEmail}
            className="mt-2.5 h-12 flex-row items-center justify-center gap-2 rounded-pill border border-border bg-background">
            <Ionicons name="mail-outline" size={18} color={colors.text} />
            <Text className="text-[15px] font-semibold text-text">{t('termsEmailSupport')}</Text>
          </ScaledPressable>
        </View>
      </ScrollView>

      {/* Sticky acceptance footer */}
      {hydrated ? (
        <View className="border-t border-border bg-surface px-4 pb-3 pt-3">
          <ScaledPressable
            disabled={accepted}
            onPress={toggleChecked}
            accessibilityRole="checkbox"
            accessibilityState={{ checked, disabled: accepted }}
            className="mb-3 flex-row items-start gap-3">
            <View
              className={`mt-0.5 h-5 w-5 items-center justify-center rounded-md border-2 ${
                checked
                  ? 'border-primary bg-primary'
                  : 'border-border bg-surface'
              }`}>
              {checked ? (
                <Ionicons name="checkmark" size={14} color={colors.text} />
              ) : null}
            </View>
            <Text className="flex-1 text-[13px] leading-5 text-text">
              {t('termsAcceptCheckbox')}
            </Text>
          </ScaledPressable>

          <ScaledPressable
            disabled={accepted || !checked}
            onPress={handleAccept}
            className={`h-[52px] items-center justify-center rounded-pill ${
              accepted
                ? 'bg-success/20'
                : checked
                  ? 'bg-primary'
                  : 'bg-disabled'
            }`}>
            <Text
              className={`text-base font-bold ${
                accepted ? 'text-success' : 'text-text'
              }`}>
              {accepted ? t('termsAccepted') : t('termsAccept')}
            </Text>
          </ScaledPressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}
