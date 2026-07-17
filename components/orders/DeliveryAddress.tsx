import { memo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { ShippingAddress } from '@/types/order';
import { borderRadius, theme } from '@constants/theme';

interface DeliveryAddressProps {
  address: ShippingAddress;
}

export const DeliveryAddress = memo(function DeliveryAddress({ address }: DeliveryAddressProps) {
  return (
    <View
      style={{
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: '#F0F7FF',
        padding: 16,
      }}>
      <Text style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, color: theme.textMuted }}>
        SHIPPING ADDRESS
      </Text>
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
        <Ionicons name="location" size={22} color={theme.info} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: theme.textPrimary }}>
            {address.name}
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 2 }}>
            {address.phone}
          </Text>
          <Text style={{ fontSize: 13, color: theme.textSecondary, marginTop: 6, lineHeight: 20 }}>
            {address.address}
          </Text>
          <Text style={{ fontSize: 13, color: theme.textMuted, marginTop: 4 }}>
            PIN: {address.pin}
          </Text>
          {address.instructions ? (
            <View
              style={{
                marginTop: 10,
                backgroundColor: theme.white,
                borderRadius: borderRadius.md,
                padding: 10,
              }}>
              <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                <Text style={{ fontWeight: '700' }}>Instructions: </Text>
                {address.instructions}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
});
