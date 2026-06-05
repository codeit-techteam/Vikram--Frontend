import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import MapView, { Marker } from 'react-native-maps';

import { PrimaryButton } from '@components/PrimaryButton';
import { ScaledPressable } from '@components/ScaledPressable';
import type { ProjectSite } from '@store/deliveryStore';

interface ProjectSiteSheetProps {
  editSite?: ProjectSite | null;
  onSave: (data: Omit<ProjectSite, 'id'>) => void;
  onClose: () => void;
}

const DEFAULT_COORDS = { lat: 19.076, lng: 72.877 };

export const ProjectSiteSheet = forwardRef<BottomSheet, ProjectSiteSheetProps>(
  ({ editSite, onSave, onClose }, ref) => {
    const [name, setName] = useState(editSite?.name ?? '');
    const [contact, setContact] = useState(editSite?.contact ?? '');
    const [phone, setPhone] = useState(editSite?.phone ?? '');
    const [address, setAddress] = useState(editSite?.address ?? '');
    const [city, setCity] = useState(editSite?.city ?? 'Mumbai');
    const [pincode, setPincode] = useState(editSite?.pincode ?? '');
    const [gateNote, setGateNote] = useState(editSite?.gateNote ?? '');
    const [lat, setLat] = useState(editSite?.lat ?? DEFAULT_COORDS.lat);
    const [lng, setLng] = useState(editSite?.lng ?? DEFAULT_COORDS.lng);

    const snapPoints = useMemo(() => ['90%'], []);

    useEffect(() => {
      setName(editSite?.name ?? '');
      setContact(editSite?.contact ?? '');
      setPhone(editSite?.phone ?? '');
      setAddress(editSite?.address ?? '');
      setCity(editSite?.city ?? 'Mumbai');
      setPincode(editSite?.pincode ?? '');
      setGateNote(editSite?.gateNote ?? '');
      setLat(editSite?.lat ?? DEFAULT_COORDS.lat);
      setLng(editSite?.lng ?? DEFAULT_COORDS.lng);
    }, [editSite]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    );

    const handleSave = () => {
      if (!name.trim() || !contact.trim() || !phone.trim() || !address.trim()) return;
      onSave({
        name: name.trim(),
        contact: contact.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        gateNote: gateNote.trim() || undefined,
        lat,
        lng,
        warehouseDist: editSite?.warehouseDist ?? '10 km',
        estDelivery: editSite?.estDelivery ?? '1h',
        status: editSite?.status ?? 'pending',
      });
      onClose();
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={onClose}
        backgroundStyle={{ borderRadius: 20 }}>
        <BottomSheetScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}>
          <Text className="mb-4 text-lg font-bold text-text">
            {editSite ? 'Edit Project Site' : 'Add New Project Site'}
          </Text>

          <Field label="Site Name" value={name} onChangeText={setName} />
          <Field label="Contact Person Name" value={contact} onChangeText={setContact} />
          <Field label="Contact Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label="Full Address" value={address} onChangeText={setAddress} multiline />
          <View className="mb-3 flex-row gap-3">
            <View className="flex-1">
              <Field label="City" value={city} onChangeText={setCity} />
            </View>
            <View className="flex-1">
              <Field label="Pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" />
            </View>
          </View>
          <Field
            label="Gate Instructions (optional)"
            value={gateNote}
            onChangeText={setGateNote}
            multiline
          />

          <Text className="mb-2 text-xs font-semibold uppercase text-text-secondary">Pin Location</Text>
          <View className="mb-4 overflow-hidden rounded-card" style={{ height: 180 }}>
            <MapView
              style={{ flex: 1 }}
              region={{
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}>
              <Marker
                coordinate={{ latitude: lat, longitude: lng }}
                draggable
                onDragEnd={(e) => {
                  setLat(e.nativeEvent.coordinate.latitude);
                  setLng(e.nativeEvent.coordinate.longitude);
                }}
                pinColor="#FF6B00"
              />
            </MapView>
          </View>

          <PrimaryButton title="Save Site" onPress={handleSave} />
          <ScaledPressable onPress={onClose} className="mt-3 items-center py-2">
            <Text className="text-sm text-text-secondary">Cancel</Text>
          </ScaledPressable>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

ProjectSiteSheet.displayName = 'ProjectSiteSheet';

function Field({
  label,
  value,
  onChangeText,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  multiline?: boolean;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1 text-xs font-semibold uppercase text-text-secondary">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        keyboardType={keyboardType}
        className="rounded-input border border-border bg-input px-4 py-3 text-base text-text"
        placeholderTextColor="#999"
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}
