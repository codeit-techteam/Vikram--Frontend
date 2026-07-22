import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import type { DeliverySite } from '@store/deliveryStore';
import { useTranslation } from '@store/languageStore';

const DEFAULT_SITE = {
  name: 'Site A – Mumbai North Industrial Estate',
  address: 'Plot 42, Sector 12, Kandivali West, Mumbai, 400067',
};

interface DeliveryDestinationCardProps {
  site?: DeliverySite;
}

export function DeliveryDestinationCard({ site }: DeliveryDestinationCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <Ionicons name="location" size={18} color="#FEB623" />
          <Text style={styles.label}>{t('deliveryDestination')}</Text>
        </View>
        <ScaledPressable
          onPress={() => router.push('/delivery-location')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('change')}>
          <Text style={styles.changeText}>{t('change')}</Text>
        </ScaledPressable>
      </View>
      <Text style={styles.siteName}>{site?.name ?? DEFAULT_SITE.name}</Text>
      <Text style={styles.siteAddress}>{site?.address ?? DEFAULT_SITE.address}</Text>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#888888',
    textTransform: 'uppercase',
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FEB623',
  },
  siteName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  siteAddress: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
    lineHeight: 17,
  },
});
