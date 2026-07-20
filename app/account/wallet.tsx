import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { MOCK_WALLET, type WalletRefund } from '@constants/walletData';
import { useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';
import { formatINR } from '@utils/formatCurrency';

function statusColor(status: WalletRefund['status']) {
  if (status === 'completed') return '#2E7D32';
  if (status === 'pending') return '#E65100';
  return '#C62828';
}

export default function WalletScreen() {
  const { t } = useTranslation();
  const { balance, refunds } = MOCK_WALLET;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <BackHeader title={t('wallet')} onBack={safeGoBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('walletBalance')}</Text>
          <Text style={styles.balanceValue}>{formatINR(balance, false)}</Text>
          <Text style={styles.balanceHint}>{t('walletBalanceHint')}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('refundHistory')}</Text>
          {refunds.map((item) => (
            <View key={item.id} style={styles.refundRow}>
              <View style={styles.refundIcon}>
                <Ionicons name="return-down-back-outline" size={18} color="#FEB623" />
              </View>
              <View style={styles.refundBody}>
                <Text style={styles.refundTitle}>{item.title}</Text>
                <Text style={styles.refundDate}>{item.date}</Text>
              </View>
              <View style={styles.refundRight}>
                <Text style={styles.refundAmount}>+{formatINR(item.amount, false)}</Text>
                <Text style={[styles.refundStatus, { color: statusColor(item.status) }]}>
                  {item.status === 'completed'
                    ? t('completed')
                    : item.status === 'pending'
                      ? t('pending')
                      : t('failed')}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.comingSoon}>
          <Ionicons name="time-outline" size={22} color="#999" />
          <Text style={styles.comingSoonTitle}>{t('comingSoon')}</Text>
          <Text style={styles.comingSoonBody}>{t('walletComingSoonBody')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#1A2332',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  balanceValue: {
    marginTop: 8,
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  balanceHint: {
    marginTop: 8,
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  refundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  refundIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refundBody: {
    flex: 1,
    marginLeft: 12,
  },
  refundTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  refundDate: {
    marginTop: 2,
    fontSize: 11,
    color: '#999',
  },
  refundRight: {
    alignItems: 'flex-end',
  },
  refundAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2E7D32',
  },
  refundStatus: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  comingSoon: {
    marginTop: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderStyle: 'dashed',
  },
  comingSoonTitle: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  comingSoonBody: {
    marginTop: 6,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 18,
  },
});
