import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { VerifiedBadge } from '@components/gst/VerifiedBadge';
import { borderRadius, theme } from '@constants/theme';
import { accountToGstDetails, isGstAccountVerified, type GstAccount } from '@/types/gst';

type GstAccountSelectSheetProps = {
  visible: boolean;
  accounts: GstAccount[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddNew: () => void;
  onClose: () => void;
};

export function GstAccountSelectSheet({
  visible,
  accounts,
  selectedId,
  onSelect,
  onAddNew,
  onClose,
}: GstAccountSelectSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['45%', '72%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  useEffect(() => {
    if (!visible) {
      sheetRef.current?.close();
      return;
    }
    const frame = requestAnimationFrame(() => sheetRef.current?.snapToIndex(0));
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={onClose}
      bottomInset={insets.bottom}
      handleIndicatorStyle={{ backgroundColor: theme.border, width: 44 }}
      backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 24,
        }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.textPrimary, marginBottom: 4 }}>
          Select GST Account
        </Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary, marginBottom: 16 }}>
          Choose which GSTIN to use for this invoice.
        </Text>

        {accounts.map((account) => {
          const details = accountToGstDetails(account);
          const selected = account.id === selectedId;
          return (
            <ScaledPressable
              key={account.id}
              onPress={() => onSelect(account.id)}
              style={{
                borderRadius: borderRadius.lg,
                borderWidth: 1.5,
                borderColor: selected ? theme.primary : theme.border,
                backgroundColor: selected ? theme.primaryUltraLight : theme.white,
                padding: 14,
                marginBottom: 10,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: theme.primaryUltraLight,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="business-outline" size={20} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary }}>
                    {details.businessName || details.gstNumber}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.textSecondary,
                      marginTop: 2,
                      letterSpacing: 0.8,
                    }}>
                    {details.gstNumber}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    {isGstAccountVerified(account) ? (
                      <VerifiedBadge variant="verified" compact label="Verified" />
                    ) : null}
                    {account.isDefault ? (
                      <Text style={{ fontSize: 10, fontWeight: '700', color: theme.primary }}>
                        Default
                      </Text>
                    ) : null}
                  </View>
                </View>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                ) : (
                  <Ionicons name="ellipse-outline" size={22} color={theme.border} />
                )}
              </View>
            </ScaledPressable>
          );
        })}

        <ScaledPressable
          onPress={onAddNew}
          style={{
            marginTop: 4,
            borderRadius: borderRadius.lg,
            borderWidth: 1,
            borderColor: theme.border,
            borderStyle: 'dashed',
            paddingVertical: 14,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}>
          <Ionicons name="add-circle-outline" size={20} color={theme.primary} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.primary }}>Add GST Account</Text>
        </ScaledPressable>
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
