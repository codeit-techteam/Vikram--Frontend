import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CollapsibleSection } from '@components/account/CollapsibleSection';
import { ProfileSiteSheet } from '@components/account/ProfileSiteSheet';
import { AppHeader } from '@components/AppHeader';
import { DrawerShell } from '@components/DrawerShell';
import { InitialsAvatar } from '@components/InitialsAvatar';
import { ScaledPressable } from '@components/ScaledPressable';
import type { ProfileSite } from '@store/deliveryStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useTranslation } from '@store/languageStore';
import { useUserStore } from '@store/userStore';
import { pickAvatarImage } from '@utils/pickAvatar';
import { requireAuth } from '@utils/requireAuth';
import { resetAppStores } from '@utils/resetAppStores';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const QUICK_LINKS = [
  { key: 'history', icon: 'time-outline' as const, route: '/orders/history' },
  { key: 'invoices', icon: 'document-text-outline' as const, route: '/account/invoices' },
  { key: 'wallet', icon: 'wallet-outline' as const, route: '/account/wallet' },
  { key: 'loyalty', icon: 'diamond-outline' as const, route: '/account/loyalty' },
  { key: 'privacy', icon: 'shield-checkmark-outline' as const, route: '/account/privacy' },
] as const;

export default function AccountScreen() {
  const { t, language, setLanguage } = useTranslation();
  const user = useUserStore((st) => st.user);
  const setAvatar = useUserStore((st) => st.setAvatar);
  const profileSites = useDeliveryStore((st) => st.profileSites);
  const updateProfileSite = useDeliveryStore((st) => st.updateProfileSite);

  const tierLabels = {
    platinum: `⭐ ${t('platinumMember')}`,
    gold: `⭐ ${t('goldMember')}`,
    silver: `⭐ ${t('silverMember')}`,
  } as const;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [businessOpen, setBusinessOpen] = useState(true);
  const [gstOpen, setGstOpen] = useState(false);
  const [sitesOpen, setSitesOpen] = useState(true);
  const [editSite, setEditSite] = useState<ProfileSite | null>(null);

  const sheetRef = useRef<BottomSheet>(null);
  const avatarScale = useSharedValue(1);
  const screenOpacity = useSharedValue(1);
  const prevLang = useRef(language);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  useEffect(() => {
    if (prevLang.current !== language) {
      screenOpacity.value = withSequence(
        withTiming(0, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      );
      prevLang.current = language;
    }
  }, [language, screenOpacity]);

  const handleAvatarPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    avatarScale.value = withSequence(
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 10 }),
    );
    const uri = await pickAvatarImage();
    if (uri) setAvatar(uri);
  };

  const toggleSection = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter((v) => !v);
  };

  const openSiteSheet = (site: ProfileSite) => {
    setEditSite(site);
    sheetRef.current?.expand();
  };

  const handleLogout = () => {
    Alert.alert(t('logout'), t('logoutConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('logout'),
        style: 'destructive',
        onPress: () => {
          resetAppStores();
          router.replace('/login');
        },
      },
    ]);
  };

  const handleLanguage = useCallback(
    async (lang: 'en' | 'hi') => {
      if (lang === language) return;
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLanguage(lang);
    },
    [language, setLanguage],
  );

  const handleGstToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!gstOpen) {
      router.push('/account/gst-compliance');
    }
    setGstOpen((v) => !v);
  };

  return (
    <DrawerShell
      isOpen={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}>
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Animated.View style={[{ flex: 1 }, fadeStyle]}>
        <AppHeader onMenuPress={() => setDrawerOpen(true)} />

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
          {/* Profile Card */}
          <View className="mb-4 rounded-card border border-border bg-surface p-4 shadow-sm">
            <View className="flex-row items-start gap-4">
              <ScaledPressable onPress={handleAvatarPress}>
                <Animated.View style={avatarStyle}>
                  <View>
                    {user.avatar ? (
                      <Image
                        source={{ uri: user.avatar }}
                        style={{ width: 64, height: 64, borderRadius: 32 }}
                        contentFit="cover"
                      />
                    ) : (
                      <InitialsAvatar name={user.name} size={64} />
                    )}
                    <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-primary">
                      <Ionicons name="camera" size={12} color="#FFFFFF" />
                    </View>
                  </View>
                </Animated.View>
              </ScaledPressable>

              <View className="flex-1">
                <Text className="text-xl font-bold text-text">{user.name}</Text>
                <Text className="mt-0.5 text-sm text-text-secondary">
                  {user.company} • ●
                </Text>
                <View className="mt-2 self-start rounded-full bg-primary px-2.5 py-1">
                  <Text className="text-[10px] font-bold text-onPrimary">
                    {tierLabels[user.memberTier]}
                  </Text>
                </View>
              </View>
            </View>

            <ScaledPressable
              onPress={() => router.push('/account/edit-profile')}
              className="mt-4 h-11 items-center justify-center rounded-pill bg-primary">
              <Text className="text-sm font-bold text-onPrimary">{t('editProfile')}</Text>
            </ScaledPressable>
          </View>

          {/* Business Details */}
          <CollapsibleSection
            icon="briefcase-outline"
            title={t('businessDetails')}
            expanded={businessOpen}
            onToggle={() => toggleSection(setBusinessOpen)}>
            <DetailRow label={t('legalEntity')} value={user.legalEntityName} />
            <DetailRow label={t('establishmentDate')} value={user.establishmentDate} />
            <DetailRow label={t('registeredAddress')} value={user.registeredAddress} />
          </CollapsibleSection>

          {/* GST Compliance */}
          <CollapsibleSection
            icon="shield-checkmark-outline"
            title={t('gstCompliance')}
            expanded={gstOpen}
            onToggle={handleGstToggle}
            onHeaderPress={handleGstToggle}>
            {gstOpen && (
              <View className="pt-3">
                <DetailRow label="GSTIN" value={user.gstNumber} />
                <View className="mt-2 flex-row items-center gap-2">
                  <View className="rounded bg-success/15 px-2 py-0.5">
                    <Text className="text-xs font-bold text-success">VERIFIED</Text>
                  </View>
                  <Text className="text-sm text-text-secondary">
                    {t('complianceScore')}: {user.complianceScore}%
                  </Text>
                </View>
              </View>
            )}
          </CollapsibleSection>

          {/* Saved Delivery Sites */}
          <CollapsibleSection
            icon="location-outline"
            title={t('savedDeliverySites')}
            expanded={sitesOpen}
            onToggle={() => toggleSection(setSitesOpen)}
            rightElement={
              <ScaledPressable
                onPress={() => router.push('/account/add-sites')}
                hitSlop={8}>
                <View className="h-7 w-7 items-center justify-center rounded-full border border-primary">
                  <Ionicons name="add" size={16} color="#FEB623" />
                </View>
              </ScaledPressable>
            }>
            {profileSites.map((site) => (
              <ScaledPressable
                key={site.id}
                onPress={() => openSiteSheet(site)}
                className="mt-3 rounded-lg border border-border bg-background p-3">
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Ionicons
                      name={site.icon === 'person' ? 'person-outline' : 'business-outline'}
                      size={18}
                      color="#FEB623"
                    />
                    <Text className="text-sm font-bold text-text">{site.name}</Text>
                  </View>
                  {site.isPrimary && (
                    <View className="rounded bg-primary/10 px-2 py-0.5">
                      <Text className="text-[10px] font-bold text-primary">PRIMARY</Text>
                    </View>
                  )}
                </View>
                <Text className="mt-1 pl-7 text-xs text-text-secondary">{site.address}</Text>
              </ScaledPressable>
            ))}
          </CollapsibleSection>

          {/* Language */}
          <View className="mb-4 rounded-card border border-border bg-surface p-4">
            <View className="mb-3 flex-row items-center gap-2">
              <Ionicons name="globe-outline" size={20} color="#FEB623" />
              <Text className="text-base font-bold text-text">{t('languageSection')}</Text>
            </View>

            <LanguageCard
              selected={language === 'en'}
              title={t('english')}
              subtitle={t('englishSubtitle')}
              onPress={() => handleLanguage('en')}
            />
            <LanguageCard
              selected={language === 'hi'}
              title={t('hindi')}
              subtitle={t('hindiSubtitle')}
              onPress={() => handleLanguage('hi')}
            />

            <View className="mt-3 flex-row items-start gap-2 rounded-lg bg-info/10 p-3">
              <Ionicons name="information-circle" size={18} color="#2196F3" />
              <Text className="flex-1 text-xs text-text-secondary">{t('languageNote')}</Text>
            </View>
          </View>

          {/* Quick Links */}
          <View className="mb-4 overflow-hidden rounded-card border border-border bg-surface">
            {QUICK_LINKS.map((link, i) => (
              <ScaledPressable
                key={link.key}
                onPress={() => {
                  if (
                    (link.key === 'wallet' || link.key === 'invoices' || link.key === 'loyalty') &&
                    !requireAuth('Please log in to access this section.')
                  ) {
                    return;
                  }
                  router.push(link.route as Href);
                }}
                className={`flex-row items-center px-4 py-4 ${i < QUICK_LINKS.length - 1 ? 'border-b border-border' : ''}`}>
                <Ionicons name={link.icon} size={20} color="#666666" />
                <Text className="ml-3 flex-1 text-sm text-text">
                  {link.key === 'history'
                    ? t('orderHistoryMenu')
                    : link.key === 'invoices'
                      ? t('invoices')
                      : link.key === 'wallet'
                        ? t('wallet')
                        : link.key === 'loyalty'
                          ? t('loyaltyWallet')
                          : t('privacySecurity')}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
              </ScaledPressable>
            ))}
            <ScaledPressable onPress={handleLogout} className="flex-row items-center px-4 py-4">
              <Ionicons name="log-out-outline" size={20} color="#FEB623" />
              <Text className="ml-3 flex-1 text-sm font-semibold text-primary">{t('logout')}</Text>
            </ScaledPressable>
          </View>

          {/* Payment Methods */}
          <View className="rounded-card border border-border bg-surface p-4">
            <View className="mb-3 flex-row items-center gap-2">
              <View className="h-8 w-8 items-center justify-center rounded-lg bg-info/15">
                <Ionicons name="card-outline" size={18} color="#2196F3" />
              </View>
              <Text className="text-base font-bold text-text">{t('paymentMethods')}</Text>
            </View>
            <View className="flex-row items-center justify-between border-b border-border py-3">
              <Text className="text-sm text-text">HDFC Bank (GST Reg)</Text>
              <View className="rounded bg-success/15 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-success">PRIMARY</Text>
              </View>
            </View>
            <ScaledPressable
              onPress={() => router.push('/account/payment-methods')}
              className="flex-row items-center justify-between py-3">
              <Text className="text-sm text-text">Corporate UPI ID</Text>
              <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
            </ScaledPressable>
          </View>
        </ScrollView>
      </Animated.View>

      <ProfileSiteSheet
        ref={sheetRef}
        editSite={editSite}
        onClose={() => {
          sheetRef.current?.close();
          setEditSite(null);
        }}
        onSave={(data) => {
          if (editSite) updateProfileSite(editSite.id, data);
        }}
      />
    </SafeAreaView>
    </DrawerShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-3">
      <Text className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </Text>
      <Text className="mt-1 text-sm text-text">{value}</Text>
    </View>
  );
}

function LanguageCard({
  selected,
  title,
  subtitle,
  onPress,
}: {
  selected: boolean;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <ScaledPressable
      onPress={onPress}
      className={`mb-2 flex-row items-center rounded-lg border p-3 ${
        selected ? 'border-primary bg-primary/5' : 'border-border bg-background'
      }`}>
      <View className="flex-1">
        <Text className="text-sm font-bold text-text">{title}</Text>
        <Text className="text-xs text-text-secondary">{subtitle}</Text>
      </View>
      <View
        className={`h-5 w-5 items-center justify-center rounded-full border-2 ${
          selected ? 'border-primary bg-primary' : 'border-border'
        }`}>
        {selected && <View className="h-2 w-2 rounded-full bg-white" />}
      </View>
    </ScaledPressable>
  );
}
