import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

import { PrimaryButton } from '@components/PrimaryButton';
import { ScaledPressable } from '@components/ScaledPressable';
import { theme } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';

/**
 * Global bottom sheet shown whenever a protected action requires login
 * (see `requireAuth`/`requireLogin`). Mounted once in `app/_layout.tsx`.
 */
export function LoginRequiredSheet() {
  const sheetRef = useRef<BottomSheet>(null);
  const visible = useAuthStore((s) => s.loginSheetVisible);
  const hideLoginSheet = useAuthStore((s) => s.hideLoginSheet);

  const snapPoints = useMemo(() => ['38%'], []);

  useEffect(() => {
    if (visible) {
      sheetRef.current?.snapToIndex(0);
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
    ),
    [],
  );

  const handleCancel = useCallback(() => {
    hideLoginSheet();
  }, [hideLoginSheet]);

  const handleLogin = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hideLoginSheet();
    router.push('/login');
  }, [hideLoginSheet]);

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      onClose={handleCancel}
      handleIndicatorStyle={{ backgroundColor: theme.border, width: 44 }}
      backgroundStyle={{ borderTopLeftRadius: 24, borderTopRightRadius: 24 }}>
      <BottomSheetView style={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 28 }}>
        <View
          style={{
            alignSelf: 'center',
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.primaryUltraLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}>
          <Ionicons name="lock-closed" size={28} color={theme.primary} />
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: '800',
            color: theme.textPrimary,
            textAlign: 'center',
            marginBottom: 6,
          }}>
          Login Required
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.textSecondary,
            textAlign: 'center',
            marginBottom: 24,
          }}>
          Continue with Mobile Number
        </Text>

        <PrimaryButton title="Login" onPress={handleLogin} />

        <ScaledPressable onPress={handleCancel} className="mt-3 items-center py-2">
          <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textSecondary }}>
            Cancel
          </Text>
        </ScaledPressable>
      </BottomSheetView>
    </BottomSheet>
  );
}
