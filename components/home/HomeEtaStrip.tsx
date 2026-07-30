import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

import { useServiceability } from '@hooks/useServiceability';
import { useDeliveryStore } from '@store/deliveryStore';
import { buildDeliverySubtitle, deliveryIcon } from '@utils/deliveryMessages';

/** Compact home strip: customer-friendly delivery promise. */
export function HomeEtaStrip() {
  const profileSite = useDeliveryStore((s) => {
    const selected = s.profileSites.find((x) => x.id === s.selectedSiteId);
    return selected ?? s.profileSites.find((x) => x.isPrimary) ?? s.profileSites[0];
  });

  const {
    serviceable,
    deliveryETA,
    deliveryMessage,
    isLoading,
    freeDelivery,
    reason,
  } = useServiceability({
    latitude: profileSite?.latitude,
    longitude: profileSite?.longitude,
    autoCheck: true,
  });

  const hasLocation =
    profileSite?.latitude != null && profileSite?.longitude != null;

  const headline = (() => {
    if (!hasLocation) return 'Set location for delivery';
    if (isLoading) return 'Checking delivery…';
    if (serviceable && deliveryMessage) {
      return deliveryMessage.startsWith('Delivery')
        ? `⚡ ${deliveryMessage}`
        : `🟢 ${deliveryMessage}`;
    }
    return 'Delivery unavailable';
  })();

  const subline = (() => {
    if (!hasLocation) return 'Add a delivery site to see delivery options';
    if (isLoading) return 'Finding the fastest delivery option…';
    if (serviceable) {
      return buildDeliverySubtitle(true, { freeDelivery });
    }
    return reason || 'Delivery is not available at this location yet';
  })();

  const iconName = deliveryIcon(serviceable, deliveryETA) as ComponentProps<
    typeof Ionicons
  >['name'];

  return (
    <View style={styles.wrap}>
      <Ionicons
        name={iconName}
        size={16}
        color={serviceable ? '#FEB623' : '#FF3B30'}
      />
      <View style={styles.textCol}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#FEB623" />
        ) : (
          <>
            <Text style={styles.eta} numberOfLines={1}>
              {headline}
            </Text>
            <Text style={styles.subline} numberOfLines={2}>
              {subline}
            </Text>
          </>
        )}
      </View>
      {!serviceable && hasLocation && !isLoading ? (
        <Pressable style={styles.notifyBtn} accessibilityRole="button">
          <Text style={styles.notifyText}>Notify Me</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF8E8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F0E0B0',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textCol: {
    flex: 1,
  },
  eta: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subline: {
    marginTop: 1,
    fontSize: 11,
    fontWeight: '500',
    color: '#666',
  },
  notifyBtn: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0C878',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  notifyText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A6D1D',
  },
});
