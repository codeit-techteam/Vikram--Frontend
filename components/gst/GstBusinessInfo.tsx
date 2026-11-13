import { Text, View } from 'react-native';

import { borderRadius, theme } from '@constants/theme';

export type GstBusinessInfoData = {
  gstNumber: string;
  businessName: string;
  registeredAddress: string;
  state: string;
  status?: string;
  tradeName?: string | null;
  businessType?: string | null;
  taxpayerType?: string | null;
  registrationStatus?: string | null;
  registrationDate?: string | null;
};

type GstBusinessInfoProps = {
  data: GstBusinessInfoData;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value?.trim()) return null;
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 10,
          fontWeight: '700',
          color: theme.textMuted,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          marginBottom: 4,
        }}>
        {label}
      </Text>
      <Text style={{ fontSize: 15, fontWeight: '600', color: theme.textPrimary, lineHeight: 22 }}>
        {value}
      </Text>
    </View>
  );
}

export function GstBusinessInfo({ data }: GstBusinessInfoProps) {
  return (
    <View
      style={{
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.bgMain,
        padding: 16,
      }}>
      <DetailRow label="GSTIN" value={data.gstNumber} />
      <DetailRow label="Legal Name" value={data.businessName} />
      <DetailRow label="Trade Name" value={data.tradeName ?? ''} />
      <DetailRow label="Business Type" value={data.businessType ?? ''} />
      <DetailRow
        label="Registration Status"
        value={data.registrationStatus ?? data.status ?? 'Verified'}
      />
      <DetailRow label="Registered Address" value={data.registeredAddress} />
      <DetailRow label="State" value={data.state} />
      <DetailRow label="Registration Date" value={data.registrationDate ?? ''} />
    </View>
  );
}
