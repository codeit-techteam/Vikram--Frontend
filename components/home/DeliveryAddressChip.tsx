import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@constants/theme';
import { useCurrentSite } from '@hooks/useSites';
import { useAuthStore } from '@store/useAuthStore';

/** Home “Deliver to” chip — shows primary saved site. */
export function DeliveryAddressChip() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const { data: site, isLoading } = useCurrentSite(isLoggedIn);

  if (!isLoggedIn) return null;

  return (
    <Pressable
      onPress={() => router.push('/delivery-location')}
      style={styles.chip}
      hitSlop={6}>
      <Ionicons name="location" size={16} color={theme.primary} />
      <View style={styles.textCol}>
        <Text style={styles.label}>Deliver to</Text>
        <Text style={styles.value} numberOfLines={1}>
          {isLoading
            ? 'Loading…'
            : site
              ? `${site.siteName}${site.city ? ` · ${site.city}` : ''}`
              : 'Add delivery site'}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={14} color="#888" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFEF8',
    borderBottomWidth: 1,
    borderBottomColor: '#F0EAD8',
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 1,
  },
});
