import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { useReorderFeedbackStore } from '@store/reorderFeedbackStore';
import { borderRadius, theme } from '@constants/theme';

export function ReorderUnavailableSheet() {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const visible = useReorderFeedbackStore((s) => s.unavailableSheetVisible);
  const hideUnavailableSheet = useReorderFeedbackStore((s) => s.hideUnavailableSheet);
  const snapPoints = useMemo(() => ['38%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    [],
  );

  useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={hideUnavailableSheet}
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
    </BottomSheet>
  );
}
