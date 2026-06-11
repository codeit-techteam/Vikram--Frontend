import { forwardRef, useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';

import type { DeliverySite } from '@store/useSiteStore';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';

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

type SiteFormKey = 'siteName' | 'address' | 'pincode' | 'gateInstructions';

const FORM_FIELDS: {
  label: string;
  placeholder: string;
  key: SiteFormKey;
  icon: keyof typeof Ionicons.glyphMap;
  multiline?: boolean;
  keyboard?: 'default' | 'number-pad';
}[] = [
  {
    label: 'Site Name',
    placeholder: 'e.g. Skyline Tower Site',
    key: 'siteName',
    icon: 'business-outline',
  },
  {
    label: 'Full Address',
    placeholder: 'Plot no, Street, Area',
    key: 'address',
    icon: 'location-outline',
    multiline: true,
  },
  {
    label: 'Pincode',
    placeholder: '110001',
    key: 'pincode',
    icon: 'mail-outline',
    keyboard: 'number-pad',
  },
  {
    label: 'Gate Instructions',
    placeholder: 'e.g. Gate 4, call before arrival (Optional)',
    key: 'gateInstructions',
    icon: 'information-circle-outline',
    multiline: true,
  },
];

export const AddSiteSheet = forwardRef<BottomSheet, AddSiteSheetProps>(
  ({ editSite, labels, onSave, onClose }, ref) => {
    const [siteForm, setSiteForm] = useState({
      siteName: editSite?.name ?? '',
      address: editSite?.address ?? '',
      pincode: editSite?.pincode ?? '',
      gateInstructions: editSite?.gateInstructions ?? '',
    });
    const [focusedField, setFocusedField] = useState<SiteFormKey | null>(null);

    const snapPoints = useMemo(() => ['85%'], []);

    useEffect(() => {
      setSiteForm({
        siteName: editSite?.name ?? '',
        address: editSite?.address ?? '',
        pincode: editSite?.pincode ?? '',
        gateInstructions: editSite?.gateInstructions ?? '',
      });
    }, [editSite]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    );

    const handleSave = () => {
      if (!siteForm.siteName.trim() || !siteForm.address.trim()) return;
      onSave({
        name: siteForm.siteName.trim(),
        address: siteForm.address.trim(),
        pincode: siteForm.pincode.trim(),
        gateInstructions: siteForm.gateInstructions.trim() || undefined,
      });
      setSiteForm({ siteName: '', address: '', pincode: '', gateInstructions: '' });
      onClose();
    };

    const canSave = Boolean(siteForm.siteName.trim() && siteForm.address.trim());

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onClose={onClose}
        backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: '#D4C89A', width: 40 }}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: DARK }}>{labels.saveSite}</Text>
              <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>
                Register a new delivery point
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#F0F0F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="close" size={18} color="#666" />
            </TouchableOpacity>
          </View>

          {FORM_FIELDS.map((field) => (
            <View key={field.key} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}>
                <Ionicons name={field.icon} size={14} color="#888" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: DARK }}>
                  {field.key === 'siteName'
                    ? labels.siteName
                    : field.key === 'address'
                      ? labels.fullAddress
                      : field.key === 'pincode'
                        ? labels.pincode
                        : labels.gateInstructions}
                </Text>
              </View>
              <TextInput
                style={{
                  borderWidth: 1.5,
                  borderColor: focusedField === field.key ? GOLD : '#E0E0E0',
                  borderRadius: 12,
                  paddingHorizontal: 14,
                  paddingVertical: field.multiline ? 12 : 13,
                  fontSize: 15,
                  color: DARK,
                  backgroundColor: '#F8F8F8',
                  minHeight: field.multiline ? 80 : undefined,
                  textAlignVertical: field.multiline ? 'top' : 'center',
                }}
                placeholder={field.placeholder}
                placeholderTextColor="#AAAAAA"
                multiline={field.multiline}
                keyboardType={field.keyboard ?? 'default'}
                maxLength={field.key === 'pincode' ? 6 : undefined}
                value={siteForm[field.key]}
                onChangeText={(val) => setSiteForm((prev) => ({ ...prev, [field.key]: val }))}
                onFocus={() => setFocusedField(field.key)}
                onBlur={() => setFocusedField(null)}
              />
            </View>
          ))}

          <TouchableOpacity
            onPress={handleSave}
            disabled={!canSave}
            style={{
              backgroundColor: canSave ? GOLD : '#E0E0E0',
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 8,
              shadowColor: '#C8900A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: canSave ? 0.25 : 0,
              shadowRadius: 8,
              elevation: canSave ? 6 : 0,
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: canSave ? DARK : '#AAA',
              }}>
              {labels.saveSite}
            </Text>
          </TouchableOpacity>
        </BottomSheetScrollView>
      </BottomSheet>
    );
  },
);

AddSiteSheet.displayName = 'AddSiteSheet';
