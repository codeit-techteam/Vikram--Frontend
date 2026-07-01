import { Text, TouchableOpacity, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

const FOLLOW_UP_ITEMS = [
  'Confirm material quantity',
  'Confirm delivery address',
  'Share best quotation',
  'Arrange delivery',
] as const;

export default function BulkEnquirySuccessScreen() {
  const continueShopping = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  };

  const viewEnquiries = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/bulk-procurement/my-enquiries' as Href);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: '#FFF4D1',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}>
            <Ionicons name="checkmark-circle" size={56} color="#FEB623" />
          </View>

          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: '#1A1A1A',
              textAlign: 'center',
              marginBottom: 10,
            }}>
            Enquiry Submitted Successfully
          </Text>

          <Text
            style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              lineHeight: 21,
              marginBottom: 24,
              paddingHorizontal: 12,
            }}>
            Our Sales Executive has received your enquiry.{'\n'}
            We will call you shortly to:
          </Text>

          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 18,
              width: '100%',
              marginBottom: 28,
              gap: 12,
            }}>
            {FOLLOW_UP_ITEMS.map((item) => (
              <View key={item} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    backgroundColor: '#FFF4D1',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="checkmark" size={13} color="#FEB623" />
                </View>
                <Text style={{ fontSize: 14, color: '#1A1A1A', fontWeight: '500', flex: 1 }}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            onPress={continueShopping}
            style={{
              backgroundColor: '#FEB623',
              borderRadius: 50,
              paddingVertical: 15,
              width: '100%',
              alignItems: 'center',
              marginBottom: 12,
              shadowColor: '#C8900A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.85}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#1A1A1A' }}>
              Continue Shopping
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={viewEnquiries}
            style={{
              borderRadius: 50,
              paddingVertical: 15,
              width: '100%',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: '#E0E0E0',
              backgroundColor: '#fff',
            }}
            activeOpacity={0.85}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#1A1A1A' }}>
              View My Enquiries
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
