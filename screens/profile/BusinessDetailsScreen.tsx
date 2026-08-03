import { useCallback, useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { BusinessDetailsCard } from '@components/gst/BusinessDetailsCard';
import { GstBottomSheet } from '@components/gst/GstBottomSheet';
import { RemoveGstBottomSheet } from '@components/gst/RemoveGstBottomSheet';
import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';
import { useGstStore } from '@store/gstStore';
import { useUserStore } from '@store/userStore';
import { safeGoBack } from '@utils/navigation';
import { borderRadius, theme } from '@constants/theme';

import type { GstValidationResult } from '@/types/gst';

export function BusinessDetailsScreen() {
  const { t } = useTranslation();
  const details = useGstStore((s) => s.details);
  const loading = useGstStore((s) => s.loading);
  const fetchGST = useGstStore((s) => s.fetchGST);
  const removeGST = useGstStore((s) => s.removeGST);
  const saveGST = useGstStore((s) => s.saveGST);
  const updateGST = useGstStore((s) => s.updateGST);
  const businessType = useUserStore((s) => s.user.businessType);

  const [sheetVisible, setSheetVisible] = useState(false);
  const [removeSheetVisible, setRemoveSheetVisible] = useState(false);

  useEffect(() => {
    void fetchGST();
  }, [fetchGST]);

  const handleSave = useCallback(
    async (result: GstValidationResult) => {
      const payload = {
        gstNumber: result.gstNumber,
        businessName: result.businessName,
        registeredAddress: result.registeredAddress,
        state: result.state,
        pan: result.pan,
      };
      if (details) {
        await updateGST(payload);
      } else {
        await saveGST(payload);
      }
      setSheetVisible(false);
    },
    [details, saveGST, updateGST],
  );

  const handleRemove = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await removeGST();
    setRemoveSheetVisible(false);
    safeGoBack('/(tabs)/account');
  };

  const hasGst = Boolean(details?.gstNumber);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }} edges={['top']}>
      <BackHeader title={t('businessDetailsTitle')} onBack={() => safeGoBack('/(tabs)/account')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {hasGst && details ? (
          <>
            <BusinessDetailsCard details={details} businessType={businessType} />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <ScaledPressable
                onPress={() => setSheetVisible(true)}
                style={{
                  flex: 1,
                  backgroundColor: theme.primary,
                  borderRadius: borderRadius.lg,
                  paddingVertical: 15,
                  alignItems: 'center',
                }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
                  {t('editDetails')}
                </Text>
              </ScaledPressable>
              <ScaledPressable
                onPress={() => setRemoveSheetVisible(true)}
                disabled={loading}
                style={{
                  flex: 1,
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: theme.error,
                  paddingVertical: 15,
                  alignItems: 'center',
                  opacity: loading ? 0.6 : 1,
                }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.error }}>
                  {t('removeGst')}
                </Text>
              </ScaledPressable>
            </View>

            <ScaledPressable
              onPress={() => router.push('/account/gst-compliance' as never)}
              style={{
                marginTop: 12,
                borderRadius: borderRadius.lg,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: theme.white,
                paddingVertical: 14,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              }}>
              <Ionicons name="document-text-outline" size={18} color={theme.primary} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>
                View GST Certificate
              </Text>
            </ScaledPressable>
          </>
        ) : (
          <View
            style={{
              alignItems: 'center',
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.white,
              padding: 32,
            }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.primaryUltraLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
              <Ionicons name="receipt-outline" size={40} color={theme.primary} />
            </View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '800',
                color: theme.textPrimary,
                textAlign: 'center',
                marginBottom: 8,
              }}>
              {t('businessDetails')}
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: theme.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 24,
              }}>
              Complete your GST details to receive GST invoices and business benefits.
            </Text>
            <ScaledPressable
              onPress={() => setSheetVisible(true)}
              style={{
                backgroundColor: theme.primary,
                borderRadius: borderRadius.lg,
                paddingHorizontal: 24,
                paddingVertical: 14,
              }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
                {t('addGstDetails')}
              </Text>
            </ScaledPressable>
          </View>
        )}
      </ScrollView>

      <GstBottomSheet
        visible={sheetVisible}
        initialGstNumber={details?.gstNumber ?? ''}
        onClose={() => setSheetVisible(false)}
        onSave={handleSave}
      />

      <RemoveGstBottomSheet
        visible={removeSheetVisible}
        title={t('removeGstTitle')}
        message={t('removeGstMessage')}
        cancelLabel={t('cancel')}
        confirmLabel={t('removeGst')}
        isRemoving={loading}
        onClose={() => setRemoveSheetVisible(false)}
        onConfirm={handleRemove}
      />
    </SafeAreaView>
  );
}

export default BusinessDetailsScreen;
