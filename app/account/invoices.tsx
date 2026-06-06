import { useMemo, useState } from 'react';
import {
  FlatList,
  LayoutAnimation,
  Linking,
  Platform,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { router } from 'expo-router';
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

import { ScaledPressable } from '@components/ScaledPressable';
import type { StringKey } from '@constants/strings';
import { useTranslation } from '@store/languageStore';
import type { AccountInvoice, InvoiceStatus } from '@store/invoiceStore';
import { useInvoiceStore } from '@store/invoiceStore';
import { buildAccountInvoiceHtml } from '@utils/accountInvoiceHtml';
import { formatINR } from '@utils/formatCurrency';
import { safeGoBack } from '@utils/navigation';
import { showToast } from '@utils/toast';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FILTERS: { key: 'all' | 'unpaid' | 'paid' | 'overdue'; labelKey: StringKey }[] = [
  { key: 'all', labelKey: 'all' },
  { key: 'unpaid', labelKey: 'unpaid' },
  { key: 'paid', labelKey: 'paidFilter' },
  { key: 'overdue', labelKey: 'overdue' },
];
const STATUS_COLORS: Record<InvoiceStatus, { bg: string; text: string }> = {
  paid: { bg: '#E8F5E9', text: '#2E7D32' },
  pending: { bg: '#FFF3E0', text: '#FF6B00' },
  overdue: { bg: '#FFEBEE', text: '#D32F2F' },
};

export default function InvoicesScreen() {
  const { t } = useTranslation();
  const invoices = useInvoiceStore((st) => st.invoices);
  const filter = useInvoiceStore((st) => st.filter);
  const setFilter = useInvoiceStore((st) => st.setFilter);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = invoices;
    if (filter !== 'all') {
      const statusMap = { unpaid: 'pending', paid: 'paid', overdue: 'overdue' } as const;
      list = list.filter((inv) => inv.status === statusMap[filter as keyof typeof statusMap]);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.id.toLowerCase().includes(q) ||
          inv.site.toLowerCase().includes(q),
      );
    }
    return list;
  }, [invoices, filter, search]);

  const setFilterWithAnim = (f: typeof filter) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilter(f);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 px-4 py-3">
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/account')} className="mb-2 self-start">
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">{t('invoicesTitle')}</Text>

        <View className="mt-3 flex-row items-center rounded-pill border border-border bg-surface px-4 py-2.5">
          <Ionicons name="search" size={18} color="#999999" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('searchInvoice')}
            placeholderTextColor="#999"
            className="ml-2 flex-1 text-sm text-text"
          />
        </View>

        <View className="mt-3 flex-row gap-2">
          {FILTERS.map((f) => (
            <ScaledPressable
              key={f.key}
              onPress={() => setFilterWithAnim(f.key)}
              className={`rounded-full px-3 py-1.5 ${
                filter === f.key ? 'bg-primary' : 'border border-border bg-surface'
              }`}>
              <Text
                className={`text-xs font-semibold capitalize ${
                  filter === f.key ? 'text-text-inverse' : 'text-text-secondary'
                }`}>
                {t(f.labelKey)}
              </Text>
            </ScaledPressable>
          ))}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <InvoiceCard
            invoice={item}
            expanded={expandedId === item.id}
            onToggleTimeline={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setExpandedId((id) => (id === item.id ? null : item.id));
            }}
            t={t}
          />
        )}
        ListFooterComponent={
          <View className="mt-4 rounded-card bg-[#333333] p-5">
            <Text className="text-base font-bold text-white">{t('syncGstTitle')}</Text>
            <Text className="mt-2 text-xs leading-5 text-white/80">{t('syncGstSubtitle')}</Text>
            <ScaledPressable
              onPress={() => showToast(t('comingSoon'))}
              className="mt-4 items-center rounded-pill border border-white py-2.5">
              <Text className="text-sm font-bold text-primary">{t('connectErp')}</Text>
            </ScaledPressable>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function InvoiceCard({
  invoice,
  expanded,
  onToggleTimeline,
  t,
}: {
  invoice: AccountInvoice;
  expanded: boolean;
  onToggleTimeline: () => void;
  t: (key: StringKey) => string;
}) {
  const colors = STATUS_COLORS[invoice.status];
  const timelineHeight = useSharedValue(0);

  const timelineStyle = useAnimatedStyle(() => ({
    height: timelineHeight.value,
    opacity: timelineHeight.value > 0 ? 1 : 0,
  }));

  const toggleTimeline = () => {
    timelineHeight.value = withTiming(expanded ? 0 : 80, { duration: 250 });
    onToggleTimeline();
  };

  const downloadPdf = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const html = buildAccountInvoiceHtml(invoice);
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf' });
    }
  };

  const shareWhatsApp = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = encodeURIComponent(
      `Invoice ${invoice.id} — ${formatINR(invoice.total, false)} from BuildQuick India`,
    );
    Linking.openURL(`whatsapp://send?text=${text}`);
  };

  return (
    <View className="mb-4 rounded-card border border-border bg-surface p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold text-primary">{invoice.id}</Text>
        <View style={{ backgroundColor: colors.bg }} className="rounded px-2 py-0.5">
          <Text style={{ color: colors.text }} className="text-[10px] font-bold uppercase">
            {invoice.status === 'pending' ? 'PENDING' : invoice.status}
          </Text>
        </View>
      </View>
      <Text className="mt-1 text-xs text-text-secondary">
        {invoice.date} • {invoice.site}
      </Text>

      <Text className="mt-3 text-[10px] font-semibold uppercase text-text-secondary">
        {t('totalAmountLabel')}
      </Text>
      <Text className="text-2xl font-bold text-text">{formatINR(invoice.total, false)}</Text>

      <View className="mt-3 flex-row rounded-lg bg-background">
        <GstCol label={`CGST (${invoice.cgst > 0 ? '9%' : '0%'})`} value={formatINR(invoice.cgst, false)} />
        <View className="w-px bg-border" />
        <GstCol label={`SGST (${invoice.sgst > 0 ? '9%' : '0%'})`} value={formatINR(invoice.sgst, false)} />
        <View className="w-px bg-border" />
        <GstCol
          label={`IGST (${invoice.igst > 0 ? '18%' : '0%'})`}
          value={formatINR(invoice.igst, false)}
        />
      </View>

      <View className="mt-3 flex-row items-center">
        <ScaledPressable
          onPress={downloadPdf}
          className="mr-2 flex-row items-center rounded-full border border-primary px-3 py-1.5">
          <Ionicons name="download-outline" size={14} color="#FF6B00" />
          <Text className="ml-1 text-xs font-semibold text-primary">{t('pdf')}</Text>
        </ScaledPressable>
        <ScaledPressable
          onPress={shareWhatsApp}
          className="flex-row items-center rounded-full border border-success px-3 py-1.5">
          <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
          <Text className="ml-1 text-xs font-semibold text-success">{t('whatsapp')}</Text>
        </ScaledPressable>
        <ScaledPressable onPress={toggleTimeline} className="ml-auto">
          <Text className="text-xs font-semibold text-primary">{t('viewTimeline')}</Text>
        </ScaledPressable>
      </View>

      <Animated.View style={[{ overflow: 'hidden' }, timelineStyle]} className="mt-2">
        <View className="rounded-lg bg-background p-3">
          <TimelineStep label={t('invoiceGenerated')} done />
          <TimelineStep label={t('paymentReceived')} done={invoice.status === 'paid'} />
          <TimelineStep label={t('gstFiled')} done={invoice.status === 'paid'} />
        </View>
      </Animated.View>
    </View>
  );
}

function GstCol({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center py-3">
      <Text className="text-[9px] text-text-secondary">{label}</Text>
      <Text className="mt-1 text-xs font-bold text-text">{value}</Text>
    </View>
  );
}

function TimelineStep({ label, done }: { label: string; done?: boolean }) {
  return (
    <View className="mb-1 flex-row items-center gap-2">
      <Ionicons
        name={done ? 'checkmark-circle' : 'ellipse-outline'}
        size={14}
        color={done ? '#2E7D32' : '#CCCCCC'}
      />
      <Text className="text-xs text-text-secondary">{label}</Text>
    </View>
  );
}
