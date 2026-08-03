import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  ScrollView,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { ScaledPressable } from '@components/ScaledPressable';
import { useInvoices } from '@hooks/useInvoices';
import { useTranslation } from '@store/languageStore';
import type {
  AccountInvoiceListItem,
  InvoiceListFilter,
  InvoiceSort,
} from '@/types/invoice';
import {
  formatInvoiceDate,
  invoiceRouteParams,
  isPaidPaymentStatus,
  paymentStatusLabel,
} from '@utils/invoiceAdapters';
import { formatINR } from '@utils/formatCurrency';
import { shareInvoicePdf } from '@hooks/useInvoices';
import { safeGoBack } from '@utils/navigation';
import { showToast } from '@utils/toast';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS: { key: InvoiceListFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'gst', label: 'GST Invoice' },
  { key: 'retail', label: 'Retail Invoice' },
  { key: 'paid', label: 'Paid' },
  { key: 'pending', label: 'Pending' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'last_30_days', label: 'Last 30 Days' },
  { key: 'this_year', label: 'This Year' },
];

const SORTS: { key: InvoiceSort; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'highest_amount', label: 'Highest Amount' },
  { key: 'lowest_amount', label: 'Lowest Amount' },
];

export default function InvoicesScreen() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<InvoiceListFilter>('all');
  const [sort, setSort] = useState<InvoiceSort>('newest');

  const {
    invoices,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    loadMore,
  } = useInvoices(search, filter, sort);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('invoicesTitle')} onBack={() => safeGoBack('/(tabs)/account')} />

      <View className="mb-2 px-4">
        <View className="flex-row items-center rounded-pill border border-border bg-surface px-4 py-2.5">
          <Ionicons name="search" size={18} color="#999999" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search invoice, order, product, date"
            placeholderTextColor="#999"
            className="ml-2 flex-1 text-sm text-text"
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ gap: 8 }}>
          {FILTERS.map((f) => (
            <ScaledPressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 ${
                filter === f.key ? 'bg-primary' : 'border border-border bg-surface'
              }`}>
              <Text
                className={`text-xs font-semibold ${
                  filter === f.key ? 'text-onPrimary' : 'text-text-secondary'
                }`}>
                {f.label}
              </Text>
            </ScaledPressable>
          ))}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-2"
          contentContainerStyle={{ gap: 8 }}>
          {SORTS.map((s) => (
            <ScaledPressable
              key={s.key}
              onPress={() => setSort(s.key)}
              className={`rounded-full px-3 py-1.5 ${
                sort === s.key ? 'bg-text' : 'border border-border bg-surface'
              }`}>
              <Text
                className={`text-xs font-semibold ${
                  sort === s.key ? 'text-white' : 'text-text-secondary'
                }`}>
                {s.label}
              </Text>
            </ScaledPressable>
          ))}
        </ScrollView>
      </View>

      {isLoading && invoices.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FEB623" />
        </View>
      ) : (
        <FlatList
          data={invoices}
          keyExtractor={(item) => item.id || `${item.orderId}-${item.invoiceNumber}`}
          contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) loadMore();
          }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => <InvoiceCard invoice={item} />}
          ListEmptyComponent={<EmptyInvoices />}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View className="items-center py-4">
                <ActivityIndicator color="#FEB623" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

function EmptyInvoices() {
  return (
    <View className="flex-1 items-center justify-center px-6 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/15">
        <Ionicons name="document-text-outline" size={32} color="#FEB623" />
      </View>
      <Text className="text-center text-lg font-bold text-text">No invoices available yet.</Text>
      <Text className="mt-2 text-center text-sm leading-5 text-text-secondary">
        Your completed orders will automatically appear here.
      </Text>
      <ScaledPressable
        onPress={() => router.push('/(tabs)/catalog' as Href)}
        className="mt-6 h-11 items-center justify-center rounded-pill bg-primary px-6">
        <Text className="text-sm font-bold text-onPrimary">Browse Products</Text>
      </ScaledPressable>
    </View>
  );
}

function InvoiceCard({ invoice }: { invoice: AccountInvoiceListItem }) {
  const paid = isPaidPaymentStatus(invoice.paymentStatus);
  const cancelled = invoice.status === 'CANCELLED';
  const statusBg = cancelled ? '#FFEBEE' : paid ? '#E8F5E9' : '#FFF4D1';
  const statusColor = cancelled ? '#D32F2F' : paid ? '#2E7D32' : '#FEB623';
  const statusText = cancelled
    ? 'Cancelled'
    : paymentStatusLabel(invoice.paymentStatus);

  const openDetails = async () => {
    await Haptics.selectionAsync();
    router.push(invoiceRouteParams(invoice.orderId, invoice.id) as Href);
  };

  const download = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const { uri, filename } = await shareInvoicePdf(invoice.orderId);
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: filename,
          UTI: 'com.adobe.pdf',
        });
      } else {
        showToast('Invoice PDF ready');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to download invoice');
    }
  };

  const share = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = encodeURIComponent(
      `Invoice ${invoice.invoiceNumber} — Order ${invoice.orderNumber} — ${formatINR(invoice.grandTotal, false)} from Bajriwala`,
    );
    Linking.openURL(`whatsapp://send?text=${text}`).catch(() => undefined);
  };

  return (
    <View className="mb-4 rounded-card border border-border bg-surface p-4 shadow-sm">
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-sm font-bold text-primary">
            Invoice #{invoice.invoiceNumber}
          </Text>
          <Text className="mt-1 text-xs text-text-secondary">
            Order {invoice.orderNumber}
          </Text>
        </View>
        <View className="items-end gap-1">
          <View style={{ backgroundColor: statusBg }} className="rounded px-2 py-0.5">
            <Text style={{ color: statusColor }} className="text-[10px] font-bold uppercase">
              {statusText}
            </Text>
          </View>
          <View
            className={`rounded px-2 py-0.5 ${
              invoice.invoiceType === 'GST' ? 'bg-info/15' : 'bg-background'
            }`}>
            <Text
              className={`text-[10px] font-bold ${
                invoice.invoiceType === 'GST' ? 'text-info' : 'text-text-secondary'
              }`}>
              {invoice.invoiceType === 'GST' ? 'GST Invoice' : 'Retail Invoice'}
            </Text>
          </View>
        </View>
      </View>

      <Text className="mt-3 text-xs text-text-secondary">
        {formatInvoiceDate(invoice.invoiceDate)}
        {invoice.customerName ? ` · ${invoice.customerName}` : ''}
      </Text>

      <Text className="mt-3 text-2xl font-bold text-text">
        {formatINR(invoice.grandTotal, false)}
      </Text>

      <View className="mt-3 flex-row flex-wrap gap-2">
        <ScaledPressable
          onPress={openDetails}
          className="flex-row items-center rounded-full border border-primary px-3 py-1.5">
          <Ionicons name="eye-outline" size={14} color="#FEB623" />
          <Text className="ml-1 text-xs font-semibold text-primary">View</Text>
        </ScaledPressable>
        <ScaledPressable
          onPress={download}
          className="flex-row items-center rounded-full border border-border px-3 py-1.5">
          <Ionicons name="download-outline" size={14} color="#666666" />
          <Text className="ml-1 text-xs font-semibold text-text">Download</Text>
        </ScaledPressable>
        <ScaledPressable
          onPress={share}
          className="flex-row items-center rounded-full border border-success px-3 py-1.5">
          <Ionicons name="share-social-outline" size={14} color="#2E7D32" />
          <Text className="ml-1 text-xs font-semibold text-success">Share</Text>
        </ScaledPressable>
      </View>
    </View>
  );
}
