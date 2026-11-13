import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { GstAccountDetailsSheet } from '@components/gst/GstAccountDetailsSheet';
import { GstBottomSheet } from '@components/gst/GstBottomSheet';
import { ScaledPressable } from '@components/ScaledPressable';
import { VerifiedBadge } from '@components/gst/VerifiedBadge';
import { useGstStore } from '@store/gstStore';
import { safeGoBack } from '@utils/navigation';
import { borderRadius, theme } from '@constants/theme';
import {
  accountToGstDetails,
  isGstAccountVerified,
  type GstAccount,
  type GstValidationResult,
} from '@/types/gst';

export default function GstAccountsScreen() {
  const accounts = useGstStore((s) => s.accounts);
  const loading = useGstStore((s) => s.loading);
  const loadAccounts = useGstStore((s) => s.loadAccounts);
  const saveGstDetails = useGstStore((s) => s.saveGstDetails);
  const setDefaultAccount = useGstStore((s) => s.setDefaultAccount);
  const archiveAccount = useGstStore((s) => s.archiveAccount);

  const [addVisible, setAddVisible] = useState(false);
  const [detailsAccount, setDetailsAccount] = useState<GstAccount | null>(null);

  const activeAccounts = useMemo(
    () => accounts.filter((a) => !a.isArchived),
    [accounts],
  );

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const handleSave = useCallback(
    async (result: GstValidationResult) => {
      await saveGstDetails(result);
      setAddVisible(false);
    },
    [saveGstDetails],
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bgMain }} edges={['top']}>
      <BackHeader title="GST Accounts" onBack={() => safeGoBack('/(tabs)/account')} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <ScaledPressable
          onPress={() => setAddVisible(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: theme.primary,
            borderRadius: borderRadius.lg,
            paddingVertical: 14,
            marginBottom: 16,
          }}>
          <Ionicons name="add" size={22} color={theme.textPrimary} />
          <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>Add GST</Text>
        </ScaledPressable>

        {loading && activeAccounts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : activeAccounts.length === 0 ? (
          <View
            style={{
              alignItems: 'center',
              borderRadius: borderRadius.lg,
              borderWidth: 1,
              borderColor: theme.border,
              backgroundColor: theme.white,
              padding: 28,
            }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                backgroundColor: theme.primaryUltraLight,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
              <Ionicons name="receipt-outline" size={36} color={theme.primary} />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.textPrimary }}>
              No GST accounts yet
            </Text>
            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                color: theme.textSecondary,
                textAlign: 'center',
                lineHeight: 20,
              }}>
              Verify your GSTIN to receive GST invoices on business purchases.
            </Text>
          </View>
        ) : (
          activeAccounts.map((account) => {
            const details = accountToGstDetails(account);
            return (
              <ScaledPressable
                key={account.id}
                onPress={() => setDetailsAccount(account)}
                style={{
                  borderRadius: borderRadius.lg,
                  borderWidth: 1,
                  borderColor: theme.border,
                  backgroundColor: theme.white,
                  padding: 14,
                  marginBottom: 10,
                }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: theme.primaryUltraLight,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Ionicons name="business-outline" size={22} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: theme.textPrimary }}>
                      {details.businessName || details.gstNumber}
                    </Text>
                    <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2, letterSpacing: 0.8 }}>
                      {details.gstNumber}
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
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
                  <Ionicons name="chevron-forward" size={18} color={theme.mediumGray} />
                </View>
              </ScaledPressable>
            );
          })
        )}
      </ScrollView>

      <GstBottomSheet
        visible={addVisible}
        onClose={() => setAddVisible(false)}
        onSave={handleSave}
      />

      <GstAccountDetailsSheet
        visible={Boolean(detailsAccount)}
        account={detailsAccount}
        busy={loading}
        onSetDefault={setDefaultAccount}
        onArchive={archiveAccount}
        onClose={() => setDetailsAccount(null)}
      />
    </SafeAreaView>
  );
}
