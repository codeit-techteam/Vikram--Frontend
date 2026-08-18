import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';
import type { DeliverySite } from '@store/deliveryStore';
import { useTranslation } from '@store/languageStore';

interface DeliveryDestinationCardProps {
  site?: DeliverySite;
  onChange: () => void;
}

export function DeliveryDestinationCard({ site, onChange }: DeliveryDestinationCardProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <Ionicons name="location" size={18} color="#FEB623" />
          <Text style={styles.label}>{t('deliveryAddress')}</Text>
        </View>
        {site?.name ? (
          <ScaledPressable
            onPress={onChange}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={t('change')}>
            <Text style={styles.changeText}>{t('change')}</Text>
          </ScaledPressable>
        ) : null}
      </View>

      {site?.name ? (
        <>
          <Text style={styles.eyebrow}>{t('deliveryTo')}</Text>
          <Text style={styles.siteName}>{site.name}</Text>
          {site.address ? <Text style={styles.siteAddress}>{site.address}</Text> : null}
        </>
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.siteName}>{t('addDeliveryAddress')}</Text>
          <Text style={styles.siteAddress}>{t('addAddressToCalculateDelivery')}</Text>
          <ScaledPressable onPress={onChange} style={styles.addBtn}>
            <Ionicons name="add" size={16} color="#1A1A1A" />
            <Text style={styles.addBtnText}>{t('addAddress')}</Text>
          </ScaledPressable>
        </View>
      )}
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
  eyebrow: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    marginBottom: 4,
  },
  siteName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  siteAddress: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyWrap: {
    gap: 4,
  },
  addBtn: {
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
  addBtnText: {
    fontWeight: '800',
    fontSize: 13,
    color: '#1A1A1A',
  },
});
