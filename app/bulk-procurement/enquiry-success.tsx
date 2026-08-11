import { Text, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBulkEnquiryStore } from '@store/bulkEnquiryStore';

export default function BulkEnquirySuccessScreen() {
  const params = useLocalSearchParams<{ enquiryNumber?: string }>();
  const lastSubmitted = useBulkEnquiryStore((s) => s.lastSubmitted);
  const enquiryNumber =
    (typeof params.enquiryNumber === 'string' && params.enquiryNumber) ||
    lastSubmitted?.enquiryNumber ||
    '';

  const backHome = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)' as Href);
  };

  const trackEnquiry = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (lastSubmitted?.id) {
      router.replace(
        `/bulk-procurement/enquiry-detail?id=${encodeURIComponent(lastSubmitted.id)}` as Href,
      );
      return;
    }
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

          {enquiryNumber ? (
            <View
              style={{
                backgroundColor: '#FFF4D1',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 8,
                marginBottom: 14,
              }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: '#1A1A1A',
                  textAlign: 'center',
                }}>
                {enquiryNumber}
              </Text>
            </View>
          ) : null}

          <Text
            style={{
              fontSize: 14,
              color: '#666',
              textAlign: 'center',
              lineHeight: 21,
              marginBottom: 28,
              paddingHorizontal: 12,
            }}>
            Our procurement team will contact you shortly.
          </Text>

          <TouchableOpacity
            onPress={trackEnquiry}
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
              Track Enquiry
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={backHome}
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
              Back to Home
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
