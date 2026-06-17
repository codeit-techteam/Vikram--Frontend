import { useState } from 'react';
import { ActivityIndicator, LayoutAnimation, Linking, Platform, ScrollView, Text, UIManager, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { ScaledPressable } from '@components/ScaledPressable';
import { buildInvoiceHtml, getInvoiceData } from '@constants/invoiceData';
import { getProductImageUrl } from '@constants/catalogData';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useOrderStore } from '@store/orderStore';
import { formatINR } from '@utils/formatCurrency';
import { safeGoBack } from '@utils/navigation';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function InvoiceScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const { invoiceId } = useLocalSearchParams<{ invoiceId: string }>();
  const orders = useOrderStore((s) => s.orders);
  const order = orders.find((o) => o.invoiceId === invoiceId);
  const invoice = getInvoiceData(invoiceId ?? 'BJW-INV-88294', order);

  const [termsExpanded, setTermsExpanded] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const toggleTerms = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTermsExpanded((v) => !v);
  };

  const downloadPdf = async () => {
    setDownloading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const html = buildInvoiceHtml(invoice);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice ${invoice.id}`,
        });
      }
    } finally {
      setDownloading(false);
    }
  };

  const shareWhatsApp = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = encodeURIComponent(
      `Invoice ${invoice.id} from Bajriwala — Total: ${formatINR(invoice.totalAmount)}. View details in the app.`,
    );
    const url = `whatsapp://send?text=${text}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader
        title={t('invoiceDetails')}
        onBack={() => safeGoBack('/account/invoices')}
        rightElement={
          <Ionicons name="ellipsis-vertical" size={20} color="#1A1A1A" />
        }
      />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-bold text-text">{invoice.id}</Text>
            <View className="rounded bg-success/15 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-success">✓ {t('verified')}</Text>
            </View>
          </View>
          <Text className="mt-1 text-xs text-text-secondary">
            Issued on {invoice.issuedDate} • Due in {invoice.dueDays} days
          </Text>
          <Text className="mt-4 text-[10px] font-bold text-text-secondary">{t('totalAmountLabel')}</Text>
          <Text className="text-3xl font-bold text-primary">
            {formatINR(invoice.totalAmount)}
          </Text>
        </View>

        <View className="mb-4 rounded-card border-l-4 border-primary bg-surface p-4">
          <Text className="text-[10px] font-bold text-text-secondary">{t('billedFrom')}</Text>
          <Text className="mt-1 text-base font-bold text-primary">{invoice.billedFrom.name}</Text>
          <Text className="mt-1 text-xs text-text-secondary">{invoice.billedFrom.address}</Text>
          <Text className="mt-2 text-xs text-text-secondary">
            GSTIN: {invoice.billedFrom.gstin}
          </Text>
        </View>

        <View className="mb-4 rounded-card border-l-4 border-secondary bg-surface p-4">
          <Text className="text-[10px] font-bold text-text-secondary">{t('billedTo')}</Text>
          <Text className="mt-1 text-base font-bold text-text">{invoice.billedTo.name}</Text>
          <Text className="mt-1 text-xs text-text-secondary">{invoice.billedTo.address}</Text>
          <Text className="mt-2 text-xs text-text-secondary">GSTIN: {invoice.billedTo.gstin}</Text>
        </View>

        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <View className="flex-row justify-between">
            <Text className="font-bold text-text">{t('itemsOrdered')}</Text>
            <Text className="text-xs text-text-secondary">{invoice.items.length} Units Total</Text>
          </View>
          <View className="mt-3 flex-row border-b border-border pb-2">
            {['ITEM', 'QTY', 'PRICE', 'TOTAL'].map((h) => (
              <Text
                key={h}
                className={`text-[9px] font-bold text-text-secondary ${h === 'ITEM' ? 'flex-[2]' : 'flex-1 text-right'}`}>
                {h}
              </Text>
            ))}
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} className="mt-3 flex-row items-center">
              <View className="flex-[2] flex-row items-center gap-2">
                <Image
                  source={{ uri: getProductImageUrl(item.imageSearch, '80x80') }}
                  style={{ width: 40, height: 40, borderRadius: 6 }}
                  contentFit="cover"
                />
                <View className="flex-1">
                  <Text className="text-xs font-bold text-text">{item.name}</Text>
                  <Text className="text-[10px] text-text-secondary">{item.spec}</Text>
                </View>
              </View>
              <Text className="flex-1 text-right text-xs font-semibold">{item.qty}x</Text>
              <Text className="flex-1 text-right text-xs">{formatINR(item.unitPrice)}</Text>
              <Text className="flex-1 text-right text-xs font-bold">
                {formatINR(item.total)}
              </Text>
            </View>
          ))}

          <View className="my-4 h-px bg-border" />
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-sm text-text-secondary">{t('subtotal')}</Text>
              <Text className="text-sm font-semibold">{formatINR(invoice.subtotal)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-text-secondary">CGST (9%)</Text>
              <Text className="text-sm font-semibold">{formatINR(invoice.cgst)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-text-secondary">SGST (9%)</Text>
              <Text className="text-sm font-semibold">{formatINR(invoice.sgst)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-text-secondary">{t('shippingLogistics')}</Text>
              <Text className="text-sm font-bold text-success">{t('free')}</Text>
            </View>
          </View>
          <View className="my-3 h-px bg-border" />
          <View className="flex-row items-end justify-between">
            <View>
              <Text className="text-[10px] font-bold text-text-secondary">{t('totalAmountPayable')}</Text>
              <Text className="text-[10px] text-primary">{t('inclusiveTaxes')}</Text>
            </View>
            <Text className="text-2xl font-bold text-text">
              {formatINR(invoice.totalAmount)}
            </Text>
          </View>
        </View>

        <ScaledPressable onPress={toggleTerms} className="mb-2 flex-row items-center justify-between">
          <Text className="text-[10px] font-bold tracking-widest text-text-secondary">
            {t('termsSection')}
          </Text>
          <Ionicons name={termsExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#666" />
        </ScaledPressable>
        {termsExpanded && (
          <View className="mb-4 rounded-card bg-trust p-4">
            {[
              'Payment is due within 14 days of invoice generation.',
              'Goods once sold will not be taken back unless damaged.',
              'Subject to Gurgaon Jurisdiction only.',
            ].map((term) => (
              <Text key={term} className="mb-2 text-xs text-text-secondary">
                • {term}
              </Text>
            ))}
          </View>
        )}

        <View className="mb-6 rounded-card border border-border bg-surface p-4">
          <Text className="mb-4 font-bold text-text">{t('timeline')}</Text>
          {invoice.timeline.map((step, i) => (
            <View key={step.label} className="flex-row gap-3">
              <View className="items-center">
                <View
                  className={`h-5 w-5 rounded-full ${
                    step.completed ? 'bg-primary' : 'border-2 border-border'
                  }`}
                />
                {i < invoice.timeline.length - 1 && (
                  <View
                    className={`h-10 w-0.5 ${step.completed ? 'bg-primary' : 'bg-border'}`}
                  />
                )}
              </View>
              <View className="flex-1 pb-4">
                <Text className="text-sm font-bold text-text">{step.label}</Text>
                <Text className="text-xs text-text-secondary">{step.date}</Text>
              </View>
            </View>
          ))}
        </View>

        <ScaledPressable
          onPress={downloadPdf}
          disabled={downloading}
          className="mb-3 flex-row items-center justify-center rounded-pill bg-primary py-4">
          {downloading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
              <Text className="ml-2 font-bold text-text-inverse">{t('downloadPdfShort')}</Text>
            </>
          )}
        </ScaledPressable>

        <ScaledPressable
          onPress={shareWhatsApp}
          className="flex-row items-center justify-center rounded-pill py-4"
          style={{ backgroundColor: '#25D366' }}>
          <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
          <Text className="ml-2 font-bold text-text-inverse">{t('shareOnWhatsAppShort')}</Text>
        </ScaledPressable>
      </ScrollView>
    </SafeAreaView>
  );
}
