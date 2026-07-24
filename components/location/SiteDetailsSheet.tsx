import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type {
  BottomSheetBackdropProps,
  BottomSheetFooterProps,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@components/PrimaryButton';
import { theme } from '@constants/theme';
import { useSiteMutations } from '@hooks/useSites';
import type { ResolvedAddress } from '@services/LocationService';
import {
  SITE_TYPE_OPTIONS,
  type DeliverySite,
  type SiteType,
} from '@services/sites.api';
import { useAuthStore } from '@store/useAuthStore';

interface SiteDetailsSheetProps {
  initialAddress: ResolvedAddress;
  editSite?: DeliverySite | null;
  onSaved: (site: DeliverySite) => void;
  onClose: () => void;
}

export const SiteDetailsSheet = forwardRef<BottomSheetModal, SiteDetailsSheetProps>(
  ({ initialAddress, editSite, onSaved, onClose }, ref) => {
    const insets = useSafeAreaInsets();
    const customer = useAuthStore((s) => s.customer);
    const { create, update } = useSiteMutations();

    const [siteName, setSiteName] = useState(editSite?.siteName ?? '');
    const [siteType, setSiteType] = useState<SiteType>(
      editSite?.siteType ?? 'CONSTRUCTION_SITE',
    );
    const [fullAddress, setFullAddress] = useState(
      editSite?.fullAddress ?? initialAddress.fullAddress,
    );
    const [landmark, setLandmark] = useState(editSite?.landmark ?? '');
    const [gateNumber, setGateNumber] = useState(editSite?.gateNumber ?? '');
    const [floor, setFloor] = useState(editSite?.floor ?? '');
    const [contactPerson, setContactPerson] = useState(
      editSite?.contactPerson ?? customer?.name ?? '',
    );
    const [phone, setPhone] = useState(editSite?.phone ?? customer?.phone ?? '');
    const [pincode, setPincode] = useState(
      editSite?.pincode ?? initialAddress.pincode,
    );
    const [city, setCity] = useState(editSite?.city ?? initialAddress.city);
    const [stateName, setStateName] = useState(
      editSite?.state ?? initialAddress.state,
    );
    const [deliveryNotes, setDeliveryNotes] = useState(
      editSite?.deliveryNotes ?? '',
    );
    const [error, setError] = useState<string | null>(null);
    const [showTypePicker, setShowTypePicker] = useState(false);

    const snapPoints = useMemo(() => ['92%'], []);
    const saving = create.isPending || update.isPending;
    const footerHeight = 72 + Math.max(insets.bottom, 12);

    useEffect(() => {
      setSiteName(editSite?.siteName ?? '');
      setSiteType(editSite?.siteType ?? 'CONSTRUCTION_SITE');
      setFullAddress(editSite?.fullAddress ?? initialAddress.fullAddress);
      setLandmark(editSite?.landmark ?? '');
      setGateNumber(editSite?.gateNumber ?? '');
      setFloor(editSite?.floor ?? '');
      setContactPerson(editSite?.contactPerson ?? customer?.name ?? '');
      setPhone(editSite?.phone ?? customer?.phone ?? '');
      setPincode(editSite?.pincode ?? initialAddress.pincode);
      setCity(editSite?.city ?? initialAddress.city);
      setStateName(editSite?.state ?? initialAddress.state);
      setDeliveryNotes(editSite?.deliveryNotes ?? '');
      setError(null);
    }, [editSite, initialAddress, customer]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      [],
    );

    const handleSave = useCallback(async () => {
      Keyboard.dismiss();

      if (!siteName.trim()) {
        setError('Site name is required');
        return;
      }
      if (!fullAddress.trim()) {
        setError('Address is required');
        return;
      }
      if (!city.trim() || !stateName.trim() || !pincode.trim()) {
        setError('City, state and pincode are required');
        return;
      }

      const lat = editSite?.latitude ?? initialAddress.latitude;
      const lng = editSite?.longitude ?? initialAddress.longitude;
      if (!lat || !lng) {
        setError('Location coordinates are missing. Please reconfirm on map.');
        return;
      }

      setError(null);
      const payload = {
        siteName: siteName.trim(),
        siteType,
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        fullAddress: fullAddress.trim(),
        landmark: landmark.trim() || undefined,
        gateNumber: gateNumber.trim() || undefined,
        floor: floor.trim() || undefined,
        city: city.trim(),
        state: stateName.trim(),
        country: initialAddress.country || 'India',
        pincode: pincode.trim(),
        latitude: lat,
        longitude: lng,
        deliveryNotes: deliveryNotes.trim() || undefined,
      };

      try {
        const site = editSite
          ? await update.mutateAsync({ id: editSite.id, payload })
          : await create.mutateAsync(payload);
        onSaved(site);
      } catch (e) {
        const message =
          (e as { message?: string })?.message ?? 'Unable to save site. Try again.';
        setError(message);
      }
    }, [
      siteName,
      fullAddress,
      city,
      stateName,
      pincode,
      editSite,
      initialAddress,
      siteType,
      contactPerson,
      phone,
      landmark,
      gateNumber,
      floor,
      deliveryNotes,
      create,
      update,
      onSaved,
    ]);

    const renderFooter = useCallback(
      (props: BottomSheetFooterProps) => (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: '#F0EAD8',
            }}>
            {error ? (
              <Text style={{ color: '#C0392B', marginBottom: 8, fontSize: 12 }}>{error}</Text>
            ) : null}
            <PrimaryButton
              title={saving ? 'Saving…' : 'Save Site'}
              onPress={() => void handleSave()}
              disabled={saving}
            />
            {saving ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: 8 }} />
            ) : null}
          </View>
        </BottomSheetFooter>
      ),
      [error, saving, handleSave, insets.bottom],
    );

    return (
      <BottomSheetModal
        ref={ref}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableBlurKeyboardOnGesture
        backdropComponent={renderBackdrop}
        footerComponent={renderFooter}
        onDismiss={() => {
          Keyboard.dismiss();
          onClose();
        }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        backgroundStyle={{ borderRadius: 20 }}
        handleIndicatorStyle={{ backgroundColor: '#D4C89A', width: 44 }}>
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: footerHeight + 24,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable onPress={Keyboard.dismiss} accessible={false}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: '#1A1A1A',
                marginBottom: 16,
              }}>
              {editSite ? 'Edit Delivery Site' : 'Add Address Details'}
            </Text>
          </Pressable>

          <Field
            label="Site Name *"
            value={siteName}
            onChangeText={setSiteName}
            placeholder="Skyline Tower"
            returnKeyType="next"
          />

          <Text style={labelStyle}>Site Type</Text>
          <Pressable onPress={() => setShowTypePicker((v) => !v)} style={inputStyle}>
            <Text style={{ color: '#1A1A1A', fontSize: 15 }}>
              {SITE_TYPE_OPTIONS.find((o) => o.value === siteType)?.label}
            </Text>
          </Pressable>
          {showTypePicker ? (
            <View
              style={{
                marginBottom: 12,
                borderWidth: 1,
                borderColor: '#E8E0C8',
                borderRadius: 12,
                overflow: 'hidden',
              }}>
              {SITE_TYPE_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    setSiteType(opt.value);
                    setShowTypePicker(false);
                  }}
                  style={{
                    padding: 12,
                    backgroundColor: siteType === opt.value ? '#FFF8E7' : '#fff',
                  }}>
                  <Text style={{ fontWeight: siteType === opt.value ? '700' : '400' }}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <Field
            label="Address *"
            value={fullAddress}
            onChangeText={setFullAddress}
            multiline
          />
          <Field
            label="Landmark"
            value={landmark}
            onChangeText={setLandmark}
            placeholder="Optional"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Gate Number"
                value={gateNumber}
                onChangeText={setGateNumber}
                placeholder="Optional"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Floor"
                value={floor}
                onChangeText={setFloor}
                placeholder="Optional"
              />
            </View>
          </View>
          <Field
            label="Contact Person"
            value={contactPerson}
            onChangeText={setContactPerson}
          />
          <Field
            label="Phone Number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Field label="City *" value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Pincode *"
                value={pincode}
                onChangeText={setPincode}
                keyboardType="number-pad"
              />
            </View>
          </View>
          <Field label="State *" value={stateName} onChangeText={setStateName} />
          <Field
            label="Special Instructions / Delivery Notes"
            value={deliveryNotes}
            onChangeText={setDeliveryNotes}
            multiline
            placeholder="Optional"
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

SiteDetailsSheet.displayName = 'SiteDetailsSheet';

const labelStyle = {
  fontSize: 12,
  fontWeight: '600' as const,
  color: '#888',
  marginBottom: 6,
  marginTop: 4,
};

const inputStyle = {
  borderWidth: 1,
  borderColor: '#E8E0C8',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  marginBottom: 12,
  backgroundColor: '#FFFEF8',
  fontSize: 15,
  color: '#1A1A1A',
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  returnKeyType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  returnKeyType?: 'next' | 'done';
}) {
  return (
    <View>
      <Text style={labelStyle}>{label}</Text>
      <BottomSheetTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#AAA"
        multiline={multiline}
        keyboardType={keyboardType}
        returnKeyType={returnKeyType}
        style={[
          inputStyle,
          multiline ? { minHeight: 72, textAlignVertical: 'top' as const } : null,
        ]}
      />
    </View>
  );
}
