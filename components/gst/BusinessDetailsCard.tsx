import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { VerifiedBadge } from '@components/gst/VerifiedBadge';
import { borderRadius, theme } from '@constants/theme';
import type { GstDetails } from '@/types/gst';
import { formatInvoiceDate, maskPan } from '@utils/invoiceAdapters';

type BusinessDetailsCardProps = {
  details: GstDetails;
  businessType?: string;
  gstLabel?: string;
  businessNameLabel?: string;
  addressLabel?: string;
  stateLabel?: string;
  statusLabel?: string;
  panLabel?: string;
  businessTypeLabel?: string;
  updatedLabel?: string;
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

function statusVariant(status: GstDetails['status']): 'verified' | 'pending' | 'failed' {
  if (status === 'verified') return 'verified';
  if (status === 'failed') return 'failed';
  return 'pending';
}

function statusLabelFor(status: GstDetails['status']): string {
  if (status === 'verified') return '✔ GST Verified';
  if (status === 'failed') return 'Verification Failed';
  return 'Pending';
}

export function BusinessDetailsCard({
  details,
  businessType,
  gstLabel = 'GSTIN',
  businessNameLabel = 'Business Name',
  addressLabel = 'Registered Address',
  stateLabel = 'State',
  statusLabel = 'Status',
  panLabel = 'PAN',
  businessTypeLabel = 'Business Type',
  updatedLabel = 'Updated',
}: BusinessDetailsCardProps) {
  const typeValue = businessType || details.businessType || '';

  return (
    <View
      style={{
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor:
          details.status === 'verified'
            ? `${theme.success}30`
            : details.status === 'failed'
              ? `${theme.error}30`
              : theme.border,
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

      <DetailRow label={businessNameLabel} value={details.businessName || '—'} />
      <DetailRow label={gstLabel} value={details.gstNumber} />
      {details.pan ? <DetailRow label={panLabel} value={maskPan(details.pan)} /> : null}
      {typeValue ? <DetailRow label={businessTypeLabel} value={typeValue} /> : null}
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
        <VerifiedBadge
          variant={statusVariant(details.status)}
          label={statusLabelFor(details.status)}
        />
      </View>

      {details.updatedAt ? (
        <DetailRow label={updatedLabel} value={formatInvoiceDate(details.updatedAt)} />
      ) : null}
    </View>
  );
}
