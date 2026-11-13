import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GstBusinessInfo } from '@components/gst/GstBusinessInfo';
import { ScaledPressable } from '@components/ScaledPressable';
import { VerifiedBadge } from '@components/gst/VerifiedBadge';
import { borderRadius, theme } from '@constants/theme';
import { accountToGstDetails, isGstAccountVerified, type GstAccount } from '@/types/gst';

type GstAccountDetailsSheetProps = {
  visible: boolean;
  account: GstAccount | null;
  busy?: boolean;
  onSetDefault: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onClose: () => void;
};

export function GstAccountDetailsSheet({
  visible,
  account,
  busy,
  onSetDefault,
  onArchive,
  onClose,
}: GstAccountDetailsSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['58%', '85%'], []);
  const [acting, setActing] = useState(false);

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
  }, [visible, account?.id]);

  const details = account ? accountToGstDetails(account) : null;

  const confirmArchive = () => {
    if (!account) return;
    Alert.alert(
      'Archive GST account?',
      'This GSTIN will be removed from checkout and invoice selection. You can add it again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setActing(true);
              try {
                await onArchive(account.id);
                onClose();
              } finally {
                setActing(false);
              }
            })();
          },
        },
      ],
    );
  };

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
        {!account || !details ? (
          <Text style={{ fontSize: 14, color: theme.textSecondary }}>No account selected</Text>
        ) : (
          <>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: theme.textPrimary }}>
                GST Account
              </Text>
              {isGstAccountVerified(account) ? (
                <View style={{ marginTop: 8 }}>
                  <VerifiedBadge variant="verified" label="Verified" />
                </View>
              ) : null}
            </View>

            <GstBusinessInfo data={{ ...details, status: account.registrationStatus ?? undefined }} />

            {!account.isDefault ? (
              <ScaledPressable
                onPress={() => {
                  void (async () => {
                    setActing(true);
                    try {
                      await onSetDefault(account.id);
                    } finally {
                      setActing(false);
                    }
                  })();
                }}
                disabled={acting || busy}
                style={{
                  marginTop: 16,
                  backgroundColor: theme.primary,
                  borderRadius: borderRadius.lg,
                  paddingVertical: 14,
                  alignItems: 'center',
                  opacity: acting || busy ? 0.7 : 1,
                }}>
                {acting || busy ? (
                  <ActivityIndicator color={theme.textPrimary} size="small" />
                ) : (
                  <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
                    Set as Default
                  </Text>
                )}
              </ScaledPressable>
            ) : (
              <View
                style={{
                  marginTop: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}>
                <Ionicons name="star" size={16} color={theme.primary} />
                <Text style={{ fontSize: 13, fontWeight: '700', color: theme.textSecondary }}>
                  Default billing account
                </Text>
              </View>
            )}

            <ScaledPressable
              onPress={confirmArchive}
              disabled={acting || busy}
              style={{
                marginTop: 10,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: theme.error,
                paddingVertical: 14,
                alignItems: 'center',
                opacity: acting || busy ? 0.6 : 1,
              }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: theme.error }}>Archive Account</Text>
            </ScaledPressable>
          </>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
