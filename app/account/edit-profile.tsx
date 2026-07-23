import { useCallback, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { ProfileSiteSheet } from '@components/account/ProfileSiteSheet';
import { PrimaryButton } from '@components/PrimaryButton';
import { ScaledPressable } from '@components/ScaledPressable';
import type { ProfileSite } from '@store/deliveryStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useTranslation } from '@store/languageStore';
import { useUserStore } from '@store/userStore';
import { updateProfile } from '@services/customer.api';
import { safeGoBack } from '@utils/navigation';
import { pickAvatarImage } from '@utils/pickAvatar';
import { showToast } from '@utils/toast';
import {
  validateEmail,
  validateName,
  validatePhone,
} from '@utils/validation';

const BUSINESS_TYPES = ['Construction Co.', 'Contractor', 'Architect', 'Developer', 'Individual'];
const PROCUREMENT_OPTIONS = ['Under ₹10L', '₹10L-₹50L', '₹50L - ₹1Cr', '₹1Cr+'];
const CITIES = ['Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'];

type FieldKey = 'name' | 'phone' | 'email';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const user = useUserStore((st) => st.user);
  const setAvatar = useUserStore((st) => st.setAvatar);
  const updateUserData = useUserStore((st) => st.updateUser);
  const profileSites = useDeliveryStore((st) => st.profileSites);
  const updateProfileSite = useDeliveryStore((st) => st.updateProfileSite);
  const addProfileSite = useDeliveryStore((st) => st.addProfileSite);

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [businessType, setBusinessType] = useState(user.businessType);
  const [procurement, setProcurement] = useState(user.procurement);
  const [city, setCity] = useState(user.city);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'done'>('idle');
  const [pickerField, setPickerField] = useState<'businessType' | 'procurement' | null>(null);
  const [editSite, setEditSite] = useState<ProfileSite | null>(null);

  const siteSheetRef = useRef<BottomSheet>(null);
  const avatarScale = useSharedValue(1);

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const tierLabel =
    user.memberTier === 'platinum'
      ? `✦ ${t('platinumMember')}`
      : user.memberTier === 'gold'
        ? `✦ ${t('goldMember')}`
        : `✦ ${t('silverMember')}`;

  const validate = useCallback(() => {
    const next: Partial<Record<FieldKey, string>> = {};
    const nameErr = validateName(name);
    const phoneErr = validatePhone(phone);
    const emailErr = validateEmail(email);
    if (nameErr) next.name = nameErr;
    if (phoneErr) next.phone = phoneErr;
    if (emailErr) next.email = emailErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, phone, email]);

  const handleSave = async () => {
    if (!validate()) return;
    setSaveState('saving');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const profile = await updateProfile({
        fullName: name.trim(),
        email: email.trim() || undefined,
        businessType: businessType || undefined,
      });
      useUserStore.getState().setFromProfile(profile);
      updateUserData({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        businessType,
        procurement,
        city: city.trim(),
      });
      setSaveState('done');
      await new Promise((r) => setTimeout(r, 600));
      showToast(t('profileSaved'));
      safeGoBack('/(tabs)/account');
    } catch {
      setSaveState('idle');
      Alert.alert('Save failed', 'Could not update your profile. Please try again.');
    }
  };

  const handleAvatar = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    avatarScale.value = withSequence(
      withSpring(1.1, { damping: 8 }),
      withSpring(1, { damping: 10 }),
    );
    const uri = await pickAvatarImage();
    if (uri) setAvatar(uri);
  };

  const handleBack = () => {
    const hasChanges =
      name !== user.name ||
      phone !== user.phone ||
      email !== user.email ||
      businessType !== user.businessType ||
      procurement !== user.procurement ||
      city !== user.city;

    if (!hasChanges) {
      safeGoBack('/(tabs)/account');
      return;
    }

    Alert.alert('Discard Changes?', 'Your unsaved changes will be lost.', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => safeGoBack('/(tabs)/account') },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader
        title={t('editProfile')}
        onBack={handleBack}
        rightElement={
          <TouchableOpacity onPress={handleSave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            {saveState === 'saving' ? (
              <Ionicons name="hourglass-outline" size={20} color="#FEB623" />
            ) : saveState === 'done' ? (
              <Ionicons name="checkmark" size={22} color="#FEB623" />
            ) : (
              <Text style={{ color: '#FEB623', fontWeight: '700', fontSize: 15 }}>{t('save')}</Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="mb-6 items-center rounded-card border border-border bg-surface p-5">
          <View className="absolute right-4 top-4 rounded-full bg-primary/10 px-2.5 py-1">
            <Text className="text-[10px] font-bold text-primary">{tierLabel}</Text>
          </View>
          <ScaledPressable onPress={handleAvatar}>
            <Animated.View style={avatarStyle}>
              <View>
                <Image
                  source={{ uri: user.avatar ?? undefined }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                  contentFit="cover"
                />
                <View className="absolute -bottom-1 -right-1 h-7 w-7 items-center justify-center rounded-full bg-primary">
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </View>
            </Animated.View>
          </ScaledPressable>
          <Text className="mt-3 text-lg font-bold text-text">{user.name}</Text>
          <Text className="text-sm text-text-secondary">{user.company}</Text>
        </View>

        <SectionLabel text={t('personalDetails')} />
        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <FormField
            icon="person-outline"
            label={t('fullName')}
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          <FormField
            icon="call-outline"
            label={t('mobileNumber')}
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            keyboardType="phone-pad"
          />
          <FormField
            icon="mail-outline"
            label={t('emailAddress')}
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
          />
        </View>

        <SectionLabel text={t('businessProfile')} />
        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <PickerField
            label={t('businessType')}
            value={businessType}
            onPress={() => setPickerField('businessType')}
          />
          <PickerField
            label={t('procurement')}
            value={procurement}
            onPress={() => setPickerField('procurement')}
          />
          <View className="mb-1">
            <Text className="mb-1 text-[10px] font-semibold uppercase text-text-secondary">
              {t('city')}
            </Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              className="rounded-input border border-border bg-input px-4 py-3 text-base text-text"
              placeholderTextColor="#999"
            />
            <View className="mt-2 flex-row flex-wrap gap-2">
              {CITIES.filter((c) => c.toLowerCase().includes(city.toLowerCase()) || !city).slice(0, 4).map((c) => (
                <ScaledPressable
                  key={c}
                  onPress={() => setCity(c)}
                  className="rounded-full border border-border px-3 py-1">
                  <Text className="text-xs text-text-secondary">{c}</Text>
                </ScaledPressable>
              ))}
            </View>
          </View>
        </View>

        <View className="mb-2 flex-row items-center justify-between">
          <SectionLabel text={t('activeProjectSites')} inline />
          <ScaledPressable
            onPress={() => {
              setEditSite(null);
              siteSheetRef.current?.expand();
            }}>
            <Text className="text-sm font-semibold text-primary">{t('addNewSite')}</Text>
          </ScaledPressable>
        </View>
        {profileSites.map((site) => (
          <ScaledPressable
            key={site.id}
            onPress={() => {
              setEditSite(site);
              siteSheetRef.current?.expand();
            }}
            className="mb-2 flex-row items-center rounded-card border border-border bg-surface p-3">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-lg bg-info/10">
              <Ionicons name="location" size={18} color="#FEB623" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-text">{site.name}</Text>
              <Text className="text-xs text-text-secondary" numberOfLines={1}>
                {site.address}
              </Text>
            </View>
            <Ionicons name="pencil-outline" size={18} color="#999999" />
          </ScaledPressable>
        ))}

        <PrimaryButton
          title={t('saveAllChanges')}
          onPress={handleSave}
          loading={saveState === 'saving'}
        />
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/account')} className="mt-4 items-center py-2">
          <Text className="text-sm text-text-secondary">{t('cancelChanges')}</Text>
        </ScaledPressable>
      </ScrollView>

      <Modal visible={pickerField !== null} transparent animationType="fade">
        <ScaledPressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setPickerField(null)}>
          <View className="rounded-t-2xl bg-surface p-4">
            {(pickerField === 'businessType' ? BUSINESS_TYPES : PROCUREMENT_OPTIONS).map((opt) => (
              <ScaledPressable
                key={opt}
                onPress={() => {
                  if (pickerField === 'businessType') setBusinessType(opt);
                  else setProcurement(opt);
                  setPickerField(null);
                }}
                className="border-b border-border py-4">
                <Text className="text-base text-text">{opt}</Text>
              </ScaledPressable>
            ))}
          </View>
        </ScaledPressable>
      </Modal>

      <ProfileSiteSheet
        ref={siteSheetRef}
        editSite={editSite}
        onClose={() => {
          siteSheetRef.current?.close();
          setEditSite(null);
        }}
        onSave={(data) => {
          if (editSite) {
            updateProfileSite(editSite.id, data);
          } else if (data.name && data.address) {
            addProfileSite({
              name: data.name,
              address: data.address,
              icon: 'business',
            });
          }
        }}
      />
    </SafeAreaView>
  );
}

function SectionLabel({ text, inline }: { text: string; inline?: boolean }) {
  return (
    <Text
      className={`text-xs font-semibold uppercase text-text-secondary ${inline ? '' : 'mb-2 ml-1'}`}>
      {text}
    </Text>
  );
}

function FormField({
  icon,
  label,
  value,
  onChangeText,
  error,
  keyboardType,
  autoCapitalize,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  error?: string;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'characters';
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-[10px] font-semibold uppercase text-text-secondary">{label}</Text>
      <View className="flex-row items-center rounded-input border border-border bg-input px-3">
        <Ionicons name={icon} size={18} color="#FEB623" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'none'}
          className="ml-2 flex-1 py-3 text-base text-text"
          placeholderTextColor="#999"
        />
      </View>
      {error && <Text className="mt-1 text-xs text-error">{error}</Text>}
    </View>
  );
}

function PickerField({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <ScaledPressable onPress={onPress} className="mb-3">
      <Text className="mb-1 text-[10px] font-semibold uppercase text-text-secondary">{label}</Text>
      <View className="flex-row items-center justify-between rounded-input border border-border bg-input px-4 py-3">
        <Text className="text-base text-text">{value}</Text>
        <Ionicons name="chevron-down" size={18} color="#999999" />
      </View>
    </ScaledPressable>
  );
}
