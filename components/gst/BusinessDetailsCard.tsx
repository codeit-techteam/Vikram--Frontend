import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { VerifiedBadge } from '@components/gst/VerifiedBadge';
import { borderRadius, theme } from '@constants/theme';
import type { GstDetails } from '@/types/gst';

type BusinessDetailsCardProps = {
  details: GstDetails;
  gstLabel?: string;
  businessNameLabel?: string;
  addressLabel?: string;
  stateLabel?: string;
  statusLabel?: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: theme.border,
      }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: theme.textMuted,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: theme.textPrimary, marginTop: 4, lineHeight: 20 }}>
        {value}
      </Text>
    </View>
  );
}

export function BusinessDetailsCard({
  details,
  gstLabel = 'GST Number',
  businessNameLabel = 'Business Name',
  addressLabel = 'Registered Address',
  stateLabel = 'State',
  statusLabel = 'Verification Status',
}: BusinessDetailsCardProps) {
  return (
    <View
      style={{
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: `${theme.success}30`,
        backgroundColor: theme.white,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
        <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
          Business Details
        </Text>
      </View>

      <DetailRow label={gstLabel} value={details.gstNumber} />
      <DetailRow label={businessNameLabel} value={details.businessName} />
      {details.registeredAddress ? (
        <DetailRow label={addressLabel} value={details.registeredAddress} />
      ) : null}
      {details.state ? <DetailRow label={stateLabel} value={details.state} /> : null}
      <View
        style={{
          marginTop: 14,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: theme.border,
        }}>
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            color: theme.textMuted,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
            marginBottom: 8,
          }}>
          {statusLabel}
        </Text>
        <VerifiedBadge variant="verified" label="Verified" />
      </View>
    </View>
  );
}
