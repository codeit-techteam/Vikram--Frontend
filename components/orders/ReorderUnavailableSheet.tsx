import { useCallback, useEffect, useRef } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useReorderFeedbackStore } from '@store/reorderFeedbackStore';
import { borderRadius, theme } from '@constants/theme';

/**
 * A plain `BottomSheet` kept at `index={-1}` still renders a full-screen backdrop
 * that captures touches until Reanimated flips it to `pointerEvents: 'none'`, so
 * this uses a modal that is only mounted while presented.
 */
export function ReorderUnavailableSheet() {
  const sheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const visible = useReorderFeedbackStore((s) => s.unavailableSheetVisible);
  const hideUnavailableSheet = useReorderFeedbackStore((s) => s.hideUnavailableSheet);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    [],
  );

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onDismiss={hideUnavailableSheet}
      handleIndicatorStyle={{ backgroundColor: theme.border, width: 40 }}>
      <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}>
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#FFEBEE',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
            <Ionicons name="alert-circle-outline" size={28} color={theme.error} />
          </View>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: theme.textPrimary,
              textAlign: 'center',
              marginBottom: 8,
            }}>
            Some products are no longer available
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.textSecondary,
              textAlign: 'center',
              lineHeight: 20,
              marginBottom: 24,
            }}>
            The items from this order cannot be added to your cart right now.
          </Text>
          <ScaledPressable
            onPress={() => {
              hideUnavailableSheet();
              router.push('/(tabs)/catalog');
            }}
            style={{
              width: '100%',
              backgroundColor: theme.primary,
              borderRadius: borderRadius.md,
              paddingVertical: 14,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
              Browse similar products
            </Text>
          </ScaledPressable>
          <ScaledPressable
            onPress={hideUnavailableSheet}
            style={{
              width: '100%',
              marginTop: 10,
              paddingVertical: 12,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textSecondary }}>
              Close
            </Text>
          </ScaledPressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
