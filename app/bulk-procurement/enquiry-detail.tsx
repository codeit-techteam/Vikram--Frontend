import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import {
  BULK_STATUS_TIMELINE,
  deliveryValueToLabel,
  formatMaterialLabel,
  timelineIndexForStatus,
} from '@constants/bulkEnquiry';
import { useBulkEnquiryStore, type BulkEnquiry } from '@store/bulkEnquiryStore';
import { showToast } from '@utils/toast';

function formatDate(iso?: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(amount: number) {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

const CANCELLABLE = new Set([
  'NEW',
  'ASSIGNED',
  'CONTACTED',
  'IN_PROGRESS',
  'QUOTE_PREPARED',
]);

export default function BulkEnquiryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const loadEnquiryById = useBulkEnquiryStore((s) => s.loadEnquiryById);
  const cancelEnquiry = useBulkEnquiryStore((s) => s.cancelEnquiry);
  const selectedEnquiry = useBulkEnquiryStore((s) => s.selectedEnquiry);
  const cached = useBulkEnquiryStore((s) =>
    s.enquiries.find((e) => e.id === id),
  );
  const [enquiry, setEnquiry] = useState<BulkEnquiry | null>(
    selectedEnquiry?.id === id ? selectedEnquiry : cached ?? null,
  );
  const [loading, setLoading] = useState(!enquiry);
  const [cancelling, setCancelling] = useState(false);

  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await loadEnquiryById(id);
      setEnquiry(data);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load enquiry');
    } finally {
      setLoading(false);
    }
  }, [id, loadEnquiryById]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeStep = useMemo(
    () =>
      timelineIndexForStatus(
        enquiry?.customerFacingStatus,
        enquiry?.status,
      ),
    [enquiry?.customerFacingStatus, enquiry?.status],
  );

  const isClosed = enquiry?.customerFacingStatus === 'Closed';
  const canCancel = enquiry ? CANCELLABLE.has(String(enquiry.status)) : false;

  const onCancel = () => {
    if (!enquiry || !canCancel) return;
    Alert.alert(
      'Cancel enquiry?',
      `Cancel ${enquiry.enquiryNumber}? This cannot be undone.`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel enquiry',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setCancelling(true);
              try {
                const updated = await cancelEnquiry(enquiry.id);
                setEnquiry(updated);
                void Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                showToast('Enquiry cancelled');
              } catch (error) {
                showToast(
                  error instanceof Error
                    ? error.message
                    : 'Failed to cancel enquiry',
                );
              } finally {
                setCancelling(false);
              }
            })();
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }} edges={['top']}>
      <BackHeader title="Enquiry Details" backgroundColor="#F5F5F5" />

      {loading && !enquiry ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FEB623" />
        </View>
      ) : !enquiry ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>Enquiry not found</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <Text style={styles.enquiryNumber}>{enquiry.enquiryNumber}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{enquiry.customerFacingStatus}</Text>
            </View>
            <Text style={styles.metaText}>Submitted {formatDate(enquiry.createdAt)}</Text>
            {enquiry.assignedExecutive?.name ? (
              <Text style={styles.metaText}>
                Executive: {enquiry.assignedExecutive.name}
              </Text>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Status</Text>
            {isClosed ? (
              <View style={styles.closedBanner}>
                <Ionicons name="close-circle" size={18} color="#FF3B30" />
                <Text style={styles.closedText}>This enquiry is closed</Text>
              </View>
            ) : (
              BULK_STATUS_TIMELINE.map((step, index) => {
                const done = index <= activeStep;
                const current = index === activeStep;
                return (
                  <View key={step} style={styles.timelineRow}>
                    <View style={styles.timelineRail}>
                      <View
                        style={[
                          styles.dot,
                          done && styles.dotDone,
                          current && styles.dotCurrent,
                        ]}
                      />
                      {index < BULK_STATUS_TIMELINE.length - 1 ? (
                        <View
                          style={[styles.rail, done && index < activeStep && styles.railDone]}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.timelineLabel,
                        done && styles.timelineLabelDone,
                        current && styles.timelineLabelCurrent,
                      ]}>
                      {step}
                    </Text>
                  </View>
                );
              })
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Requirement</Text>
            <DetailRow label="Material" value={formatMaterialLabel(enquiry)} />
            {enquiry.productType ? (
              <DetailRow label="Type" value={enquiry.productType} />
            ) : null}
            {enquiry.grade ? <DetailRow label="Grade" value={enquiry.grade} /> : null}
            {enquiry.materialTypeLabel ? (
              <DetailRow label="Spec" value={enquiry.materialTypeLabel} />
            ) : null}
            <DetailRow
              label="Quantity"
              value={`${enquiry.expectedQuantity} ${enquiry.expectedUnit}`}
            />
            {enquiry.additionalNotes ? (
              <DetailRow label="Notes" value={enquiry.additionalNotes} />
            ) : null}
            {enquiry.projectName ? (
              <DetailRow label="Project" value={enquiry.projectName} />
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Delivery</Text>
            <DetailRow label="Location" value={enquiry.location} />
            {enquiry.city ? <DetailRow label="City" value={enquiry.city} /> : null}
            {enquiry.deliveryRequirement ? (
              <DetailRow
                label="When"
                value={deliveryValueToLabel(enquiry.deliveryRequirement)}
              />
            ) : null}
            <DetailRow label="Contact" value={enquiry.preferredContact} />
          </View>

          {(enquiry.quotations?.length ?? 0) > 0 ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Quotations</Text>
              {enquiry.quotations!.map((q) => (
                <View key={q.id} style={styles.quoteCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.quoteNumber}>{q.quotationNumber}</Text>
                    <Text style={styles.quoteStatus}>{q.status}</Text>
                  </View>
                  <Text style={styles.quoteLine}>
                    {q.materialLabel} · {q.quantity} {q.unit}
                  </Text>
                  <Text style={styles.quoteTotal}>{formatCurrency(q.totalAmount)}</Text>
                  {q.validUntil ? (
                    <Text style={styles.metaText}>
                      Valid until {formatDate(q.validUntil)}
                    </Text>
                  ) : null}
                  {q.notes ? (
                    <Text style={styles.quoteNotes}>{q.notes}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {canCancel ? (
            <TouchableOpacity
              style={[styles.cancelBtn, cancelling && { opacity: 0.7 }]}
              disabled={cancelling}
              onPress={onCancel}
              activeOpacity={0.85}>
              {cancelling ? (
                <ActivityIndicator color="#FF3B30" />
              ) : (
                <Text style={styles.cancelBtnText}>Cancel Enquiry</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  headerCard: {
    backgroundColor: '#FEB623',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  enquiryNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  metaText: {
    fontSize: 12,
    color: '#333',
    opacity: 0.8,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 12,
  },
  closedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF3B30',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 36,
  },
  timelineRail: {
    width: 22,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    marginTop: 3,
  },
  dotDone: {
    backgroundColor: '#FEB623',
  },
  dotCurrent: {
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  rail: {
    width: 2,
    flex: 1,
    minHeight: 18,
    backgroundColor: '#E8E8E8',
    marginTop: 2,
  },
  railDone: {
    backgroundColor: '#FEB623',
  },
  timelineLabel: {
    flex: 1,
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    paddingBottom: 14,
    paddingLeft: 8,
  },
  timelineLabelDone: {
    color: '#444',
  },
  timelineLabelCurrent: {
    color: '#1A1A1A',
    fontWeight: '800',
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  detailLabel: {
    width: 78,
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  detailValue: {
    flex: 1,
    fontSize: 13,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  quoteCard: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  quoteNumber: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  quoteStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
  },
  quoteLine: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  quoteTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  quoteNotes: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
  },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#fff',
    marginTop: 4,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF3B30',
  },
});
