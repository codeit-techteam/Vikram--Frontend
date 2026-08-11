import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import {
  deliveryValueToLabel,
  formatMaterialLabel,
} from '@constants/bulkEnquiry';
import { useBulkEnquiryStore } from '@store/bulkEnquiryStore';
import { useAuthStore } from '@store/useAuthStore';
import { requireAuth } from '@utils/requireAuth';
import { showToast } from '@utils/toast';

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
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isGuest = useAuthStore((s) => s.isGuest);
  const enquiries = useBulkEnquiryStore((s) => s.enquiries);
  const isLoading = useBulkEnquiryStore((s) => s.isLoading);
  const error = useBulkEnquiryStore((s) => s.error);
  const loadEnquiries = useBulkEnquiryStore((s) => s.loadEnquiries);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!requireAuth('Please log in to view your enquiries.')) return;
      void loadEnquiries({ page: 1, limit: 50 }).then(() => {
        const err = useBulkEnquiryStore.getState().error;
        if (err) showToast(err);
      });
    }, [loadEnquiries]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEnquiries({ page: 1, limit: 50 });
    setRefreshing(false);
  };

  if (!isLoggedIn || isGuest) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
        <BackHeader title="My Enquiries" backgroundColor="#F5F5F5" />
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="lock-closed-outline" size={32} color="#FEB623" />
          </View>
          <Text style={styles.emptyTitle}>Login required</Text>
          <Text style={styles.emptySubtitle}>
            Please log in to view your bulk enquiries.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <BackHeader title="My Enquiries" backgroundColor="#F5F5F5" />

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FEB623" />
        }>
        {isLoading && enquiries.length === 0 ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#FEB623" />
          </View>
        ) : enquiries.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={32} color="#FEB623" />
            </View>
            <Text style={styles.emptyTitle}>No enquiries yet</Text>
            <Text style={styles.emptySubtitle}>
              Submit a bulk enquiry and track it here.
            </Text>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity
              style={styles.ctaBtn}
              onPress={() => {
                void Haptics.selectionAsync();
                router.push('/bulk-procurement/enquiry' as Href);
              }}>
              <Text style={styles.ctaBtnText}>New Enquiry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          enquiries.map((enquiry) => (
            <TouchableOpacity
              key={enquiry.id}
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => {
                void Haptics.selectionAsync();
                router.push(
                  `/bulk-procurement/enquiry-detail?id=${encodeURIComponent(enquiry.id)}` as Href,
                );
              }}>
              <View style={styles.cardHeader}>
                <Text style={styles.refId}>{enquiry.enquiryNumber}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{enquiry.customerFacingStatus}</Text>
                </View>
              </View>
              <Text style={styles.dateText}>{formatDate(enquiry.createdAt)}</Text>

              <View style={styles.detailRow}>
                <Ionicons name="layers-outline" size={14} color="#888" />
                <Text style={styles.detailText}>{formatMaterialLabel(enquiry)}</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="calculator-outline" size={14} color="#888" />
                <Text style={styles.detailText}>
                  {enquiry.expectedQuantity} {enquiry.expectedUnit}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="location-outline" size={14} color="#888" />
                <Text style={styles.detailText}>
                  {enquiry.city || enquiry.location}
                </Text>
              </View>
              {enquiry.deliveryRequirement ? (
                <View style={styles.detailRow}>
                  <Ionicons name="time-outline" size={14} color="#888" />
                  <Text style={styles.detailText}>
                    {deliveryValueToLabel(enquiry.deliveryRequirement)}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
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
    flex: 1,
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
  errorText: {
    marginTop: 10,
    fontSize: 12,
    color: '#FF3B30',
    textAlign: 'center',
  },
  ctaBtn: {
    marginTop: 20,
    backgroundColor: '#FEB623',
    borderRadius: 50,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
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
    gap: 8,
  },
  refId: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    flex: 1,
  },
  statusBadge: {
    backgroundColor: '#FFF4D1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    maxWidth: '48%',
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
