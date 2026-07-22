import { Text, View } from 'react-native';

import { borderRadius, theme } from '@constants/theme';

export type GstBusinessInfoData = {
  gstNumber: string;
  businessName: string;
  registeredAddress: string;
  state: string;
  status?: string;
};

type GstBusinessInfoProps = {
  data: GstBusinessInfoData;
};

function DetailRow({ label, value }: { label: string; value: string }) {
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
      <DetailRow label="GST Number" value={data.gstNumber} />
      <DetailRow label="Business Name" value={data.businessName} />
      <DetailRow label="GST Registered Address" value={data.registeredAddress} />
      <DetailRow label="State" value={data.state} />
      <DetailRow label="Status" value={data.status ?? 'Verified'} />
    </View>
  );
}
