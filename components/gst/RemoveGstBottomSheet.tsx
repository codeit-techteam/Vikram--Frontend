import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { borderRadius, theme } from '@constants/theme';

type RemoveGstBottomSheetProps = {
  visible: boolean;
  title?: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel?: string;
  isRemoving?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function RemoveGstBottomSheet({
  visible,
  title = 'Remove GST Details?',
  message = 'Removing GST will stop GST Invoice generation for future orders.',
  cancelLabel = 'Cancel',
  confirmLabel = 'Remove',
  isRemoving,
  onClose,
  onConfirm,
}: RemoveGstBottomSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['38%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
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
      onClose={onClose}
      handleIndicatorStyle={{ backgroundColor: theme.border, width: 44 }}>
      <BottomSheetView
        style={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 20,
        }}>
        <View style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 16 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: `${theme.error}12`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}>
            <Ionicons name="trash-outline" size={28} color={theme.error} />
          </View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: theme.textPrimary,
              textAlign: 'center',
              marginBottom: 8,
            }}>
            {title}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.textSecondary,
              textAlign: 'center',
              lineHeight: 21,
            }}>
            {message}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ScaledPressable
            onPress={onClose}
            style={{
              flex: 1,
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: theme.border,
              paddingVertical: 15,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textSecondary }}>
              {cancelLabel}
            </Text>
          </ScaledPressable>
          <ScaledPressable
            onPress={onConfirm}
            disabled={isRemoving}
            style={{
              flex: 1,
              borderRadius: borderRadius.lg,
              backgroundColor: theme.error,
              paddingVertical: 15,
              alignItems: 'center',
              opacity: isRemoving ? 0.7 : 1,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.white }}>
              {isRemoving ? 'Removing…' : confirmLabel}
            </Text>
          </ScaledPressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
