import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { ScaledPressable } from '@components/ScaledPressable';
import { shareInvoicePdf, useInvoiceDetail } from '@hooks/useInvoices';
import { useTranslation } from '@store/languageStore';
import {
  formatInvoiceDate,
  isPaidPaymentStatus,
  paymentStatusLabel,
} from '@utils/invoiceAdapters';
import { formatINR } from '@utils/formatCurrency';
import { safeGoBack } from '@utils/navigation';
import { showToast } from '@utils/toast';

function addressLines(address?: Record<string, unknown> | null): string {
  if (!address) return '—';
  const parts = [
    address.line1,
    address.line2,
    address.city,
    address.state,
    address.pincode,
  ]
    .map((p) => (p == null ? '' : String(p).trim()))
    .filter(Boolean);
  return parts.join(', ') || '—';
}

export default function InvoiceScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ invoiceId?: string; orderId?: string }>();
  const orderId = (params.orderId || params.invoiceId || '').toString();
  const { data: invoice, isLoading, isError, error, refetch } = useInvoiceDetail(
    orderId || undefined,
  );
  const [downloading, setDownloading] = useState(false);

  const paymentLabel = useMemo(
    () => paymentStatusLabel(invoice?.paymentStatus),
    [invoice?.paymentStatus],
  );

  const downloadPdf = async () => {
    if (!orderId) return;
    setDownloading(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { uri, filename } = await shareInvoicePdf(orderId);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: filename,
          UTI: 'com.adobe.pdf',
        });
      } else {
        showToast(`Saved as ${filename}`);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const shareWhatsApp = async () => {
    if (!invoice) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = encodeURIComponent(
      `Invoice ${invoice.invoiceNumber} from Bajriwala — Total: ${formatINR(invoice.grandTotal)}. View details in the app.`,
    );
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() => undefined);
  };

  if (isLoading && !invoice) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <BackHeader title={t('invoiceDetails')} onBack={() => safeGoBack('/account/invoices')} />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FEB623" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !invoice) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <BackHeader title={t('invoiceDetails')} onBack={() => safeGoBack('/account/invoices')} />
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-text-secondary">
            {error instanceof Error ? error.message : 'Invoice not found'}
          </Text>
          <ScaledPressable onPress={() => refetch()} className="mt-4">
            <Text className="font-bold text-primary">Retry</Text>
          </ScaledPressable>
        </View>
      </SafeAreaView>
    );
  }

  const paid = isPaidPaymentStatus(invoice.paymentStatus);
  const customerName =
    invoice.customer.companyName || invoice.customer.fullName || 'Customer';

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('invoiceDetails')} onBack={() => safeGoBack('/account/invoices')} />

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="flex-1 text-lg font-bold text-text">
              Invoice #{invoice.invoiceNumber}
            </Text>
            <View className={`rounded px-2 py-0.5 ${paid ? 'bg-success/15' : 'bg-primary/15'}`}>
              <Text className={`text-[10px] font-bold ${paid ? 'text-success' : 'text-primary'}`}>
                {paymentLabel}
              </Text>
            </View>
          </View>
          <Text className="mt-1 text-xs text-text-secondary">
            Order {invoice.orderNumber} · {formatInvoiceDate(invoice.invoiceDate)}
          </Text>
          <View className="mt-2 self-start rounded bg-info/15 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-info">
              {invoice.invoiceType === 'GST' ? 'GST Invoice' : 'Retail Invoice'}
            </Text>
          </View>
          <Text className="mt-4 text-[10px] font-bold text-text-secondary">
            {t('totalAmountLabel')}
          </Text>
          <Text className="text-3xl font-bold text-primary">
            {formatINR(invoice.grandTotal)}
          </Text>
        </View>

        <View className="mb-4 rounded-card border-l-4 border-primary bg-surface p-4">
          <Text className="text-[10px] font-bold text-text-secondary">Company Details</Text>
          <Text className="mt-1 text-base font-bold text-primary">Bajriwala</Text>
          <Text className="mt-1 text-xs text-text-secondary">
            Construction materials marketplace
          </Text>
        </View>

        <View className="mb-4 rounded-card border-l-4 border-secondary bg-surface p-4">
          <Text className="text-[10px] font-bold text-text-secondary">Customer Details</Text>
          <Text className="mt-1 text-base font-bold text-text">{customerName}</Text>
          <Text className="mt-1 text-xs text-text-secondary">{addressLines(invoice.address)}</Text>
          {invoice.customer.phone ? (
            <Text className="mt-2 text-xs text-text-secondary">Phone: {invoice.customer.phone}</Text>
          ) : null}
        </View>

        {(invoice.customer.gstNumber || invoice.invoiceType === 'GST') && (
          <View className="mb-4 rounded-card border border-border bg-surface p-4">
            <Text className="text-[10px] font-bold text-text-secondary">GST Details</Text>
            <Text className="mt-2 text-sm font-semibold text-text">
              GSTIN: {invoice.customer.gstNumber || '—'}
            </Text>
            {invoice.taxBreakdown ? (
              <View className="mt-3 flex-row rounded-lg bg-background">
                <TaxCol label="CGST" value={formatINR(invoice.taxBreakdown.cgst, false)} />
                <View className="w-px bg-border" />
                <TaxCol label="SGST" value={formatINR(invoice.taxBreakdown.sgst, false)} />
                <View className="w-px bg-border" />
                <TaxCol label="IGST" value={formatINR(invoice.taxBreakdown.igst, false)} />
              </View>
            ) : null}
          </View>
        )}

        <View className="mb-4 rounded-card border border-border bg-surface p-4">
          <Text className="font-bold text-text">Products</Text>
          <View className="mt-3 flex-row border-b border-border pb-2">
            {['ITEM', 'QTY', 'PRICE', 'TOTAL'].map((h) => (
              <Text
                key={h}
                className={`text-[9px] font-bold text-text-secondary ${
                  h === 'ITEM' ? 'flex-[2]' : 'flex-1 text-right'
                }`}>
                {h}
              </Text>
            ))}
          </View>
          {invoice.items.map((item, index) => (
            <View key={`${item.name}-${index}`} className="mt-3 flex-row items-center">
              <View className="flex-[2]">
                <Text className="text-xs font-bold text-text">{item.name}</Text>
                {item.unit ? (
                  <Text className="text-[10px] text-text-secondary">{item.unit}</Text>
                ) : null}
              </View>
              <Text className="flex-1 text-right text-xs font-semibold">{item.quantity}</Text>
              <Text className="flex-1 text-right text-xs">{formatINR(item.unitPrice)}</Text>
              <Text className="flex-1 text-right text-xs font-bold">
                {formatINR(item.subtotal)}
              </Text>
            </View>
          ))}

          <View className="my-4 h-px bg-border" />
          <View className="gap-2">
            <Row label={t('subtotal')} value={formatINR(invoice.subtotal)} />
            <Row label="Tax" value={formatINR(invoice.gst)} />
            {invoice.discountAmount > 0 ? (
              <Row label="Discount" value={`- ${formatINR(invoice.discountAmount)}`} />
            ) : null}
            <Row label="Delivery Charges" value={formatINR(invoice.deliveryCharge)} />
          </View>
          <View className="my-3 h-px bg-border" />
          <View className="flex-row items-end justify-between">
            <Text className="text-[10px] font-bold text-text-secondary">Grand Total</Text>
            <Text className="text-2xl font-bold text-text">{formatINR(invoice.grandTotal)}</Text>
          </View>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-text-secondary">{label}</Text>
      <Text className="text-sm font-semibold text-text">{value}</Text>
    </View>
  );
}

function TaxCol({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center py-3">
      <Text className="text-[9px] text-text-secondary">{label}</Text>
      <Text className="mt-1 text-xs font-bold text-text">{value}</Text>
    </View>
  );
}
