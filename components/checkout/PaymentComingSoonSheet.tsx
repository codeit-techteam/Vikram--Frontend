import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { borderRadius, theme } from '@constants/theme';

type PaymentComingSoonSheetProps = {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
};

export function PaymentComingSoonSheet({
  visible,
  title,
  message,
  onClose,
}: PaymentComingSoonSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['34%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.45} />
    ),
    [],
  );

  useEffect(() => {
    if (visible) {
      const frame = requestAnimationFrame(() => {
        sheetRef.current?.snapToIndex(0);
      });
      return () => cancelAnimationFrame(frame);
    }

    sheetRef.current?.close();
  }, [visible]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={onClose}
      handleIndicatorStyle={{ backgroundColor: theme.border, width: 40 }}>
      <BottomSheetView style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}>
        <View style={{ alignItems: 'center', paddingTop: 8 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: theme.primaryUltraLight,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}>
            <Ionicons name="time-outline" size={28} color={theme.primary} />
          </View>
          <Text
            style={{
              fontSize: 18,
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
              lineHeight: 20,
              marginBottom: 24,
            }}>
            {message}
          </Text>
          <ScaledPressable
            onPress={onClose}
            style={{
              width: '100%',
              backgroundColor: theme.primary,
              borderRadius: borderRadius.md,
              paddingVertical: 14,
              alignItems: 'center',
            }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
              Got it
            </Text>
          </ScaledPressable>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
