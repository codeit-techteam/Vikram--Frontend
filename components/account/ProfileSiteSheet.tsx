import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { PrimaryButton } from '@components/PrimaryButton';
import type { ProfileSite } from '@store/deliveryStore';

interface ProfileSiteSheetProps {
  editSite?: ProfileSite | null;
  onSave: (data: Partial<ProfileSite>) => void;
  onClose: () => void;
}

export const ProfileSiteSheet = forwardRef<BottomSheet, ProfileSiteSheetProps>(
  ({ editSite, onSave, onClose }, ref) => {
    const [name, setName] = useState(editSite?.name ?? '');
    const [address, setAddress] = useState(editSite?.address ?? '');

    const snapPoints = useMemo(() => ['50%'], []);

    useEffect(() => {
      setName(editSite?.name ?? '');
      setAddress(editSite?.address ?? '');
    }, [editSite]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    );

    const handleSave = () => {
      if (!name.trim() || !address.trim()) return;
      onSave({ name: name.trim(), address: address.trim() });
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
        <BottomSheetView className="px-5 pb-8">
          <Text className="mb-4 text-lg font-bold text-text">Edit Delivery Site</Text>

          <Text className="mb-1 text-xs font-semibold uppercase text-text-secondary">Site Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="mb-3 rounded-input border border-border bg-input px-4 py-3 text-base text-text"
            placeholderTextColor="#999"
          />

          <Text className="mb-1 text-xs font-semibold uppercase text-text-secondary">Full Address</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            multiline
            numberOfLines={3}
            className="mb-4 rounded-input border border-border bg-input px-4 py-3 text-base text-text"
            placeholderTextColor="#999"
            textAlignVertical="top"
          />

          <PrimaryButton title="Save Site" onPress={handleSave} />
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

ProfileSiteSheet.displayName = 'ProfileSiteSheet';
