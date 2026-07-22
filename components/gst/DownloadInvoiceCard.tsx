import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import { VerifiedBadge } from '@components/gst/VerifiedBadge';
import { borderRadius, theme } from '@constants/theme';
import type { GstDetails } from '@/types/gst';

type DownloadInvoiceCardProps = {
  details: GstDetails;
  title?: string;
  invoiceStatus?: string;
  onDownload?: () => void;
  isDownloading?: boolean;
  downloadLabel?: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginTop: 14 }}>
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

export function DownloadInvoiceCard({
  details,
  title = 'Business Invoice',
  invoiceStatus = 'Available after delivery',
  onDownload,
  isDownloading,
  downloadLabel = 'Download GST Invoice',
}: DownloadInvoiceCardProps) {
  return (
    <View
      style={{
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.white,
        padding: 16,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="receipt-outline" size={20} color={theme.primary} />
          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>{title}</Text>
        </View>
        <VerifiedBadge variant="available" label="Invoice Ready" compact />
      </View>

      <DetailRow label="GST Number" value={details.gstNumber} />
      <DetailRow label="Business Name" value={details.businessName} />
      <DetailRow label="Invoice Status" value={invoiceStatus} />

      {onDownload ? (
        <ScaledPressable
          onPress={onDownload}
          disabled={isDownloading}
          style={{
            marginTop: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderRadius: borderRadius.lg,
            borderWidth: 1.5,
            borderColor: theme.primary,
            backgroundColor: theme.primaryUltraLight,
            paddingVertical: 14,
            opacity: isDownloading ? 0.6 : 1,
          }}>
          <Ionicons name="download-outline" size={18} color={theme.primary} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textPrimary }}>
            {isDownloading ? 'Downloading…' : downloadLabel}
          </Text>
        </ScaledPressable>
      ) : null}
    </View>
  );
}
