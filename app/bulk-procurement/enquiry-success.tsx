import { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BulkEnquirySuccessScreen() {
  const referenceId = useMemo(
    () => `BJW-BULK-${Math.floor(10000 + Math.random() * 90000)}`,
    [],
  );

  const goHome = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <View style={{ padding: 16, alignItems: 'flex-end' }}>
        <TouchableOpacity
          onPress={goHome}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#F0F0F0',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="close" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
        <View
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            backgroundColor: '#FFF4D1',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}>
          <Ionicons name="checkmark-circle" size={48} color="#FEB623" />
        </View>

        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#1A1A1A',
            marginBottom: 8,
          }}>
          Enquiry Submitted!
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: '#666',
            textAlign: 'center',
            lineHeight: 21,
            marginBottom: 32,
            paddingHorizontal: 20,
          }}>
          Our procurement team will review your requirements and reach out within 2 business hours.
        </Text>

        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 16,
            width: '100%',
            marginBottom: 24,
          }}>
          <Text style={{ fontSize: 12, color: '#999', fontWeight: '600' }}>REFERENCE ID</Text>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '800',
              color: '#1A1A1A',
              marginTop: 2,
            }}>
            {referenceId}
          </Text>
        </View>

        <TouchableOpacity
          onPress={goHome}
          style={{
            backgroundColor: '#FEB623',
            borderRadius: 50,
            paddingVertical: 15,
            paddingHorizontal: 40,
          }}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A1A' }}>
            Back to Home
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
