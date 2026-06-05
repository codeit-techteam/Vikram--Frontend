import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { PrimaryButton } from '@components/PrimaryButton';
import type { DeliverySite } from '@store/useSiteStore';

interface AddSiteSheetProps {
  editSite?: DeliverySite | null;
  labels: {
    siteName: string;
    fullAddress: string;
    pincode: string;
    gateInstructions: string;
    saveSite: string;
  };
  onSave: (data: Omit<DeliverySite, 'id'>) => void;
  onClose: () => void;
}

export const AddSiteSheet = forwardRef<BottomSheet, AddSiteSheetProps>(
  ({ editSite, labels, onSave, onClose }, ref) => {
    const [name, setName] = useState(editSite?.name ?? '');
    const [address, setAddress] = useState(editSite?.address ?? '');
    const [pincode, setPincode] = useState(editSite?.pincode ?? '');
    const [gateInstructions, setGateInstructions] = useState(editSite?.gateInstructions ?? '');

    const snapPoints = useMemo(() => ['65%'], []);

    useEffect(() => {
      setName(editSite?.name ?? '');
      setAddress(editSite?.address ?? '');
      setPincode(editSite?.pincode ?? '');
      setGateInstructions(editSite?.gateInstructions ?? '');
    }, [editSite]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    );

    const handleSave = () => {
      if (!name.trim() || !address.trim() || !pincode.trim()) return;
      onSave({
        name: name.trim(),
        address: address.trim(),
        pincode: pincode.trim(),
        gateInstructions: gateInstructions.trim() || undefined,
      });
      setName('');
      setAddress('');
      setPincode('');
      setGateInstructions('');
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
          <Text className="mb-4 text-lg font-bold text-text">{labels.saveSite}</Text>

          <Text className="mb-1 text-sm text-text-secondary">{labels.siteName}</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            className="mb-3 rounded-input border border-border bg-input px-4 py-3 text-base text-text"
            placeholderTextColor="#999"
          />

          <Text className="mb-1 text-sm text-text-secondary">{labels.fullAddress}</Text>
          <TextInput
            value={address}
            onChangeText={setAddress}
            multiline
            className="mb-3 rounded-input border border-border bg-input px-4 py-3 text-base text-text"
            placeholderTextColor="#999"
          />

          <Text className="mb-1 text-sm text-text-secondary">{labels.pincode}</Text>
          <TextInput
            value={pincode}
            onChangeText={setPincode}
            keyboardType="number-pad"
            maxLength={6}
            className="mb-3 rounded-input border border-border bg-input px-4 py-3 text-base text-text"
            placeholderTextColor="#999"
          />

          <Text className="mb-1 text-sm text-text-secondary">{labels.gateInstructions}</Text>
          <TextInput
            value={gateInstructions}
            onChangeText={setGateInstructions}
            className="mb-5 rounded-input border border-border bg-input px-4 py-3 text-base text-text"
            placeholderTextColor="#999"
          />

          <PrimaryButton title={labels.saveSite} onPress={handleSave} disabled={!name || !address || !pincode} />
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

AddSiteSheet.displayName = 'AddSiteSheet';
