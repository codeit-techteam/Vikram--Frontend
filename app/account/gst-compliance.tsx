import { useEffect } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@components/PrimaryButton';
import { ScaledPressable } from '@components/ScaledPressable';
import { useTranslation } from '@store/languageStore';
import { useUserStore } from '@store/userStore';
import { buildGstCertificateHtml } from '@utils/gstCertificateHtml';
import { safeGoBack } from '@utils/navigation';

export default function GstComplianceScreen() {
  const { t } = useTranslation();
  const user = useUserStore((st) => st.user);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(user.complianceScore / 100, { duration: 1000 });
  }, [progress, user.complianceScore]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const downloadPdf = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const html = buildGstCertificateHtml(user);
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: t('gstCertificate'),
      });
    }
  };

  const sharePdf = async () => {
    await downloadPdf();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center justify-between px-4 py-3">
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/account')}>
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-base font-bold text-text">{t('businessVerification')}</Text>
        <Ionicons name="information-circle" size={22} color="#FF6B00" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-success">
            <Ionicons name="checkmark" size={28} color="#FFFFFF" />
          </View>
          <Text className="mt-3 text-lg font-bold text-text">{t('gstVerified')}</Text>
          <Text className="mt-1 text-xs text-text-secondary">
            Verified as of {user.gstVerifiedAt}
          </Text>
          <View className="mt-4 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-primary">{t('complianceScore')}</Text>
            <Text className="text-lg font-bold text-primary">{user.complianceScore}%</Text>
          </View>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-border">
            <Animated.View className="h-full rounded-full bg-primary" style={barStyle} />
          </View>
        </View>

        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-base font-bold text-text">{t('entityInformation')}</Text>
            <View className="flex-row items-center gap-1 rounded-full bg-success/15 px-2.5 py-1">
              <View className="h-1.5 w-1.5 rounded-full bg-success" />
              <Text className="text-[10px] font-bold text-success">{t('active')}</Text>
            </View>
          </View>
          <EntityRow label={t('legalEntity')} value={user.legalEntityName} />
          <View className="mt-3">
            <Text className="text-[10px] font-semibold uppercase text-text-secondary">GSTIN</Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Text className="text-sm text-text">{user.gstNumber}</Text>
              <View className="rounded bg-success/15 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-success">{t('verified')}</Text>
              </View>
            </View>
          </View>
          <EntityRow label={t('pan')} value={user.pan} />
          <EntityRow label={t('registrationDate')} value={user.establishmentDate} />
          <EntityRow label={t('businessType')} value="Private Limited Company" />
          <EntityRow label={t('jurisdiction')} value={user.jurisdiction} />
        </View>

        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-bold text-text">{t('gstCertificate')}</Text>
          <Text className="text-xs text-text-secondary">REG-06</Text>
        </View>

        <View className="mb-4 overflow-hidden rounded-card border border-border bg-info/10">
          <View className="bg-[#1e3a5f] px-4 py-3">
            <Text className="text-center text-sm font-bold text-white">
              GST COMPLIANCE VERIFICATION
            </Text>
          </View>
          <View className="p-3">
            <CertTableHeader />
            <CertRow desc="OPC Cement 53 Grade" hsn="2523" value="₹85,000" rate="28%" tax="₹23,800" />
            <CertRow desc="TMT Steel Bars 12mm" hsn="7214" value="₹1,20,000" rate="18%" tax="₹21,600" />
            <CertRow desc="Grey Fill Sand" hsn="2505" value="₹45,000" rate="5%" tax="₹2,250" />
            <View className="mt-4 items-end">
              <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-[#1e3a5f]">
                <Text className="text-[8px] font-bold text-[#1e3a5f]">SEAL</Text>
              </View>
            </View>
          </View>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <PrimaryButton title={t('downloadPdf')} onPress={downloadPdf} />
          </View>
          <ScaledPressable
            onPress={sharePdf}
            className="h-[52px] w-[52px] items-center justify-center rounded-card border border-border bg-surface">
            <Ionicons name="share-outline" size={22} color="#FF6B00" />
          </ScaledPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EntityRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mt-3">
      <Text className="text-[10px] font-semibold uppercase text-text-secondary">{label}</Text>
      <Text className="mt-1 text-sm text-text">{value}</Text>
    </View>
  );
}

function CertTableHeader() {
  return (
    <View className="mb-1 flex-row border-b border-border pb-2">
      {['Description', 'HSN', 'Value', 'Rate', 'Tax'].map((h) => (
        <Text key={h} className="flex-1 text-[8px] font-bold text-text-secondary">
          {h}
        </Text>
      ))}
    </View>
  );
}

function CertRow({
  desc,
  hsn,
  value,
  rate,
  tax,
}: {
  desc: string;
  hsn: string;
  value: string;
  rate: string;
  tax: string;
}) {
  return (
    <View className="flex-row border-b border-border/50 py-2">
      <Text className="flex-1 text-[8px] text-text">{desc}</Text>
      <Text className="flex-1 text-[8px] text-text">{hsn}</Text>
      <Text className="flex-1 text-[8px] text-text">{value}</Text>
      <Text className="flex-1 text-[8px] text-text">{rate}</Text>
      <Text className="flex-1 text-[8px] text-text">{tax}</Text>
    </View>
  );
}
