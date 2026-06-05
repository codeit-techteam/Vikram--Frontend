import { useCallback, useRef, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
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

import { ProfileSiteSheet } from '@components/account/ProfileSiteSheet';
import { PrimaryButton } from '@components/PrimaryButton';
import { ScaledPressable } from '@components/ScaledPressable';
import { useStrings } from '@hooks/useStrings';
import type { ProfileSite } from '@store/deliveryStore';
import { safeGoBack } from '@utils/navigation';
import { useDeliveryStore } from '@store/deliveryStore';
import { useUserStore } from '@store/userStore';
import { pickAvatarImage } from '@utils/pickAvatar';
import { showToast } from '@utils/toast';
import {
  validateEmail,
  validateGst,
  validateName,
  validatePhone,
} from '@utils/validation';

const BUSINESS_TYPES = ['Construction Co.', 'Contractor', 'Architect', 'Developer', 'Individual'];
const PROCUREMENT_OPTIONS = ['Under ₹10L', '₹10L-₹50L', '₹50L - ₹1Cr', '₹1Cr+'];
const CITIES = ['Mumbai', 'Pune', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'];

type FieldKey = 'name' | 'phone' | 'email' | 'gstNumber';

export default function EditProfileScreen() {
  const s = useStrings();
  const user = useUserStore((st) => st.user);
  const setAvatar = useUserStore((st) => st.setAvatar);
  const updateUserData = useUserStore((st) => st.updateUser);
  const profileSites = useDeliveryStore((st) => st.profileSites);
  const updateProfileSite = useDeliveryStore((st) => st.updateProfileSite);
  const addProfileSite = useDeliveryStore((st) => st.addProfileSite);

  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email, setEmail] = useState(user.email);
  const [gstNumber, setGstNumber] = useState(user.gstNumber);
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

  const validate = useCallback(() => {
    const next: Partial<Record<FieldKey, string>> = {};
    const nameErr = validateName(name);
    const phoneErr = validatePhone(phone);
    const emailErr = validateEmail(email);
    const gstErr = validateGst(gstNumber);
    if (nameErr) next.name = nameErr;
    if (phoneErr) next.phone = phoneErr;
    if (emailErr) next.email = emailErr;
    if (gstErr) next.gstNumber = gstErr;
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [name, phone, email, gstNumber]);

  const handleSave = async () => {
    if (!validate()) return;
    setSaveState('saving');
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateUserData({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      gstNumber: gstNumber.trim().toUpperCase(),
      businessType,
      procurement,
      city: city.trim(),
    });
    setSaveState('done');
    await new Promise((r) => setTimeout(r, 600));
    showToast(s.accountProfileSaved);
    safeGoBack('/(tabs)/account');
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

  const tierLabel =
    user.memberTier === 'platinum'
      ? '✦ Platinum Member'
      : user.memberTier === 'gold'
        ? '✦ Gold Member'
        : '✦ Silver Member';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center justify-between border-b border-border bg-surface px-4 py-3">
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/account')} className="w-10">
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-base font-bold text-primary">{s.accountEditProfile}</Text>
        <ScaledPressable onPress={handleSave} className="w-10 items-end">
          {saveState === 'saving' ? (
            <Ionicons name="hourglass-outline" size={20} color="#FF6B00" />
          ) : saveState === 'done' ? (
            <Ionicons name="checkmark" size={22} color="#FF6B00" />
          ) : (
            <Text className="text-sm font-semibold text-primary">Save</Text>
          )}
        </ScaledPressable>
      </View>

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

        <SectionLabel text={s.accountPersonalDetails} />
        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <FormField
            icon="person-outline"
            label="FULL NAME"
            value={name}
            onChangeText={setName}
            error={errors.name}
          />
          <FormField
            icon="call-outline"
            label="MOBILE NUMBER"
            value={phone}
            onChangeText={setPhone}
            error={errors.phone}
            keyboardType="phone-pad"
          />
          <FormField
            icon="mail-outline"
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
          />
          <FormField
            icon="document-text-outline"
            label="GST NUMBER"
            value={gstNumber}
            onChangeText={setGstNumber}
            error={errors.gstNumber}
            autoCapitalize="characters"
          />
        </View>

        <SectionLabel text={s.accountBusinessProfile} />
        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <PickerField
            label="BUSINESS TYPE"
            value={businessType}
            onPress={() => setPickerField('businessType')}
          />
          <PickerField
            label="PROCUREMENT"
            value={procurement}
            onPress={() => setPickerField('procurement')}
          />
          <View className="mb-1">
            <Text className="mb-1 text-[10px] font-semibold uppercase text-text-secondary">CITY</Text>
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
          <SectionLabel text={s.accountActiveSites} inline />
          <ScaledPressable
            onPress={() => {
              setEditSite(null);
              siteSheetRef.current?.expand();
            }}>
            <Text className="text-sm font-semibold text-primary">{s.accountAddNewSite}</Text>
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
              <Ionicons name="location" size={18} color="#FF6B00" />
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
          title={s.accountSaveChanges}
          onPress={handleSave}
          loading={saveState === 'saving'}
        />
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/account')} className="mt-4 items-center py-2">
          <Text className="text-sm text-text-secondary">{s.accountCancelChanges}</Text>
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
        <Ionicons name={icon} size={18} color="#FF6B00" />
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
