import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { ScaledPressable } from '@components/ScaledPressable';
import { getVehicleTier } from '@constants/deliveryVehicles';
import type { CheckoutPreview } from '@services/checkout.api';
import { useTranslation } from '@store/languageStore';
import { formatINR } from '@utils/formatCurrency';

export type CheckoutDeliveryStatus =
  | 'no_address'
  | 'invalid_location'
  | 'loading'
  | 'available'
  | 'unavailable'
  | 'error';

interface CheckoutDeliveryQuoteProps {
  status: CheckoutDeliveryStatus;
  preview: CheckoutPreview | null;
  preferenceLabel?: string | null;
  errorMessage?: string | null;
  onRetry?: () => void;
  onChangeAddress?: () => void;
  onAddAddress?: () => void;
}

export function CheckoutDeliveryQuote({
  status,
  preview,
  preferenceLabel,
  errorMessage,
  onRetry,
  onChangeAddress,
  onAddAddress,
}: CheckoutDeliveryQuoteProps) {
  const { t } = useTranslation();
  const vehicle = getVehicleTier(preview?.deliveryVehicleType);
  const vehicleLabel =
    preview?.deliveryVehicleDisplayName || vehicle.label;
  const rawMessage = preview?.deliveryMessage?.trim() || '';
  const etaLabel = (() => {
    if (preferenceLabel?.trim()) return preferenceLabel.trim();
    if (rawMessage && !/unavailable/i.test(rawMessage)) return rawMessage;
    if (preview?.deliveringBy) return `By ${preview.deliveringBy}`;
    const min = preview?.deliveryEtaMinMinutes;
    const max = preview?.deliveryEtaMaxMinutes;
    if (min && max) return `Estimated delivery ${min}–${max} mins`;
    if (preview?.deliveryETA && preview.deliveryETA > 0) {
      return `Estimated delivery ${preview.deliveryETA} mins`;
    }
    return '';
  })();
  const deliveryFree =
    Boolean(preview?.bikeDeliveryFree) || Boolean(preview?.freeDeliveryApplied);
  const deliveryCharge = preview?.deliveryCharge ?? 0;

  if (status === 'no_address') {
    return (
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>{t('deliveryMethod')}</Text>
        <Text style={styles.title}>{t('addDeliveryAddress')}</Text>
        <Text style={styles.body}>{t('addAddressToCalculateDelivery')}</Text>
        {onAddAddress ? (
          <ScaledPressable onPress={onAddAddress} style={styles.primaryBtn}>
            <Ionicons name="add" size={16} color="#1A1A1A" />
            <Text style={styles.primaryBtnText}>{t('addAddress')}</Text>
          </ScaledPressable>
        ) : null}
      </View>
    );
  }

  if (status === 'invalid_location') {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="alert-circle-outline" size={18} color="#FF3B30" />
          <Text style={styles.title}>{t('pleaseSelectValidLocation')}</Text>
        </View>
        <Text style={styles.body}>{t('invalidLocationHint')}</Text>
        {onChangeAddress ? (
          <ScaledPressable onPress={onChangeAddress} style={styles.linkBtn}>
            <Text style={styles.linkText}>{t('changeAddress')}</Text>
          </ScaledPressable>
        ) : null}
      </View>
    );
  }

  if (status === 'loading') {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <ActivityIndicator size="small" color="#FEB623" />
          <Text style={styles.title}>{t('updatingDeliveryEstimate')}</Text>
        </View>
        <Text style={styles.body}>{t('calculatingDelivery')}</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="cloud-offline-outline" size={18} color="#FF3B30" />
          <Text style={[styles.title, { flex: 1 }]}>
            {errorMessage || t('unableToCalculateDelivery')}
          </Text>
        </View>
        {onRetry ? (
          <ScaledPressable onPress={onRetry} style={styles.linkBtn}>
            <Text style={styles.linkText}>{t('retry')}</Text>
          </ScaledPressable>
        ) : null}
      </View>
    );
  }

  if (status === 'unavailable') {
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="alert-circle-outline" size={18} color="#FF3B30" />
          <Text style={[styles.title, { flex: 1 }]}>
            {preview?.readinessMessage ||
              preview?.deliveryMessage ||
              t('deliveryUnavailableAtLocation')}
          </Text>
        </View>
        <Text style={styles.body}>{t('changeAddressToContinue')}</Text>
        {onChangeAddress ? (
          <ScaledPressable onPress={onChangeAddress} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{t('changeAddress')}</Text>
          </ScaledPressable>
        ) : null}
      </View>
    );
  }

  const tripLabel =
    preview?.deliveryVehicleCount != null && preview.deliveryVehicleCount > 1
      ? ` × ${preview.deliveryVehicleCount}`
      : '';

  return (
    <View style={styles.card}>
      <Text style={styles.sectionLabel}>{t('deliveryMethod')}</Text>
      <View style={styles.methodRow}>
        <View style={styles.iconWrap}>
          {preview?.deliveryVehicleImageUrl ? (
            <Image
              source={{ uri: preview.deliveryVehicleImageUrl }}
              style={styles.vehicleImage}
              contentFit="contain"
            />
          ) : (
            <Ionicons name={vehicle.icon} size={20} color="#FEB623" />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>
            {vehicleLabel}
            {tripLabel}
          </Text>
          {preview?.fulfillmentHubName ? (
            <Text style={styles.body}>
              {t('deliveringFrom')} {preview.fulfillmentHubName}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>{t('estimatedDelivery')}</Text>
      <Text style={styles.eta}>{etaLabel || preview?.deliveringBy || '—'}</Text>
      {preview?.deliveringBy && etaLabel !== preview.deliveringBy ? (
        <Text style={styles.body}>{preview.deliveringBy}</Text>
      ) : null}

      <View style={styles.metaBlock}>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{t('deliveryCharge')}</Text>
          <Text style={[styles.metaValue, deliveryFree && styles.free]}>
            {deliveryFree || deliveryCharge === 0
              ? t('bikeDeliveryFree')
              : formatINR(deliveryCharge)}
          </Text>
        </View>
        {preview?.deliveryDistanceKm != null && preview.deliveryDistanceKm > 0 ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{t('distance')}</Text>
            <Text style={styles.metaValue}>
              {preview.deliveryDistanceKm.toFixed(1)} km
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#888888',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  body: {
    marginTop: 6,
    fontSize: 12,
    color: '#888888',
    lineHeight: 17,
  },
  primaryBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEB623',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryBtnText: {
    fontWeight: '800',
    fontSize: 13,
    color: '#1A1A1A',
  },
  linkBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FEB623',
  },
  methodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  vehicleImage: {
    width: 52,
    height: 52,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 14,
  },
  eta: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  metaBlock: {
    marginTop: 12,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    flex: 1,
    fontSize: 13,
    color: '#888888',
  },
  metaValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  free: {
    color: '#2E7D32',
  },
});
