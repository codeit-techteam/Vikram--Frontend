import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { useBulkEnquiryStore } from '@store/bulkEnquiryStore';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyEnquiriesScreen() {
  const enquiries = useBulkEnquiryStore((s) => s.enquiries);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <BackHeader title="My Enquiries" backgroundColor="#F5F5F5" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        {enquiries.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={32} color="#FEB623" />
            </View>
            <Text style={styles.emptyTitle}>No enquiries yet</Text>
            <Text style={styles.emptySubtitle}>
              Submit a bulk enquiry and track it here.
            </Text>
          </View>
        ) : (
          enquiries.map((enquiry) => (
            <View key={enquiry.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.refId}>{enquiry.id}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>Received</Text>
                </View>
              </View>
              <Text style={styles.dateText}>{formatDate(enquiry.submittedAt)}</Text>

              <View style={styles.detailRow}>
                <Ionicons name="layers-outline" size={14} color="#888" />
                <Text style={styles.detailText}>{enquiry.categories.join(', ')}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calculator-outline" size={14} color="#888" />
                <Text style={styles.detailText}>
                  {enquiry.quantity} {enquiry.unit}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={14} color="#888" />
                <Text style={styles.detailText}>{enquiry.city}</Text>
              </View>
              {enquiry.deliveryPreference ? (
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={14} color="#888" />
                  <Text style={styles.detailText}>{enquiry.deliveryPreference}</Text>
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    lineHeight: 19,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  refId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  statusBadge: {
    backgroundColor: '#FFF4D1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '500',
    flex: 1,
  },
});
