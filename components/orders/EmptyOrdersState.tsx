import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';

export function EmptyOrdersState() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 80,
      }}>
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#FFF4D1',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}>
        <Ionicons name="bag-outline" size={36} color="#FEB623" />
      </View>
      <Text
        style={{
          fontSize: 18,
          fontWeight: '800',
          color: '#1A1A1A',
          marginBottom: 6,
        }}>
        No Orders Yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: '#888',
          textAlign: 'center',
          lineHeight: 20,
          marginHorizontal: 40,
        }}>
        Your order history will appear here once you place an order.
      </Text>
      <ScaledPressable
        onPress={() => router.push('/(tabs)/catalog')}
        style={{
          backgroundColor: '#FEB623',
          borderRadius: 12,
          paddingHorizontal: 24,
          paddingVertical: 12,
          marginTop: 20,
        }}>
        <Text style={{ color: '#1A1A1A', fontWeight: '800', fontSize: 14 }}>
          Start Shopping
        </Text>
      </ScaledPressable>
    </View>
  );
}
