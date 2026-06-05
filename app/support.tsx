import { useEffect, useState } from 'react';
import { Image, Linking, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PulseDot } from '@components/orders/PulseDot';
import { ScaledPressable } from '@components/ScaledPressable';
import { safeGoBack } from '@utils/navigation';
type DisputeType = 'wrong_item' | 'damaged' | 'missing' | 'refund';

const DISPUTE_TYPES: { id: DisputeType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'wrong_item', label: 'Report Wrong Item', icon: 'cube-outline' },
  { id: 'damaged', label: 'Damaged Goods', icon: 'warning-outline' },
  { id: 'missing', label: 'Missing Quantity', icon: 'scale-outline' },
  { id: 'refund', label: 'Refund Request', icon: 'return-down-back-outline' },
];

const RESOLUTION_STEPS = [
  { label: 'Ticket Raised', time: 'Oct 24, 09:15 AM', done: true },
  { label: 'Evidence Received', time: 'Oct 24, 11:30 AM', done: true },
  { label: 'Under Investigation', time: 'In Progress', done: false, active: true },
  { label: 'Resolution Pending', time: 'ETA: 4 Hours', done: false },
];

export default function SupportScreen() {
  const [selectedDispute, setSelectedDispute] = useState<DisputeType>('damaged');
  const [uploads, setUploads] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);
  const borderOpacity = useSharedValue(1);

  useEffect(() => {
    if (picking) {
      borderOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1,
      );
    } else {
      borderOpacity.value = withTiming(1);
    }
  }, [picking, borderOpacity]);

  const uploadBorderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255, 107, 0, ${borderOpacity.value})`,
  }));

  const pickFiles = async () => {
    setPicking(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    setPicking(false);
    if (!result.canceled) {
      setUploads((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="mb-4 flex-row items-center gap-3 px-5 py-3">
        <ScaledPressable onPress={() => safeGoBack()}>
          <Ionicons name="arrow-back" size={22} color="#FF6B00" />
        </ScaledPressable>
        <Text className="text-xl font-bold text-primary">Support & Disputes</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text className="text-sm text-text-secondary">
          Reference ID: <Text className="font-bold text-primary">#TIC-9902-X</Text>
        </Text>

        <View className="mt-4 flex-row gap-2">
          <ScaledPressable className="flex-row items-center rounded-full border-2 border-primary px-4 py-2">
            <Ionicons name="time-outline" size={14} color="#FF6B00" />
            <Text className="ml-1 text-sm font-semibold text-primary">History</Text>
          </ScaledPressable>
          <ScaledPressable className="rounded-full bg-primary px-4 py-2">
            <Text className="text-sm font-bold text-text-inverse">+ New Ticket</Text>
          </ScaledPressable>
        </View>

        <View className="mt-5 rounded-card border border-border bg-surface p-4">
          <View className="flex-row justify-between">
            <View className="rounded bg-success/15 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-success">ACTIVE DISPUTE</Text>
            </View>
            <View className="rounded bg-primary/10 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-primary">In Review</Text>
            </View>
          </View>
          <Text className="mt-3 text-base font-bold text-text">
            Order #ORD-8821: Wrong Grade Steel
          </Text>
          <Text className="mt-2 text-sm leading-5 text-text-secondary">
            Structural I-Beams delivered were ASTM A36 instead of requested Grade 50. Inspection
            report attached below.
          </Text>
          <View className="mt-3 flex-row items-center gap-3 rounded-lg bg-trust p-3">
            <Ionicons name="document" size={24} color="#D32F2F" />
            <View className="flex-1">
              <Text className="text-sm font-bold text-text">metallurgy_report_final.pdf</Text>
              <Text className="text-xs text-text-secondary">2.4 MB • Uploaded 2h ago</Text>
            </View>
            <Ionicons name="download-outline" size={20} color="#FF6B00" />
          </View>
          <Text className="mt-3 text-xs text-text-secondary">
            👥 Assigned to Logistics Specialist + 2 others
          </Text>
        </View>

        <Text className="mb-3 mt-5 text-base font-bold text-text">Resolution Steps</Text>
        {RESOLUTION_STEPS.map((step, i) => (
          <View key={step.label} className="flex-row gap-3">
            <View className="items-center">
              {step.active ? (
                <PulseDot size={18} />
              ) : (
                <View
                  className={`h-4 w-4 items-center justify-center rounded-full ${
                    step.done ? 'bg-primary' : 'border-2 border-border'
                  }`}>
                  {step.done && <Ionicons name="checkmark" size={10} color="#FFF" />}
                </View>
              )}
              {i < RESOLUTION_STEPS.length - 1 && (
                <View className={`h-8 w-0.5 ${step.done ? 'bg-primary' : 'bg-border'}`} />
              )}
            </View>
            <View className="flex-1 pb-3">
              <Text className="text-sm font-bold text-text">{step.label}</Text>
              <Text className="text-xs text-text-secondary">{step.time}</Text>
            </View>
          </View>
        ))}

        <Text className="mb-3 mt-4 text-base font-bold text-text">File New Dispute</Text>
        <View className="flex-row flex-wrap gap-3">
          {DISPUTE_TYPES.map((d) => {
            const selected = selectedDispute === d.id;
            return (
              <ScaledPressable
                key={d.id}
                onPress={() => setSelectedDispute(d.id)}
                className={`w-[47%] items-center rounded-card border-2 p-4 ${
                  selected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                }`}
                scaleTo={1.02}>
                <Ionicons name={d.icon} size={24} color={selected ? '#FF6B00' : '#666'} />
                <Text
                  className={`mt-2 text-center text-xs font-semibold ${
                    selected ? 'text-primary' : 'text-text-secondary'
                  }`}>
                  {d.label}
                </Text>
              </ScaledPressable>
            );
          })}
        </View>

        <Text className="mb-2 mt-5 text-base font-bold text-text">Upload Evidence</Text>
        <Text className="mb-3 text-xs leading-4 text-text-secondary">
          Please provide high-resolution photos or videos of the damaged items. Include the shipping
          label in at least one photo.
        </Text>
        <Animated.View
          style={[uploadBorderStyle, { borderWidth: 2, borderStyle: 'dashed' }]}
          className="items-center rounded-card bg-trust p-6">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-primary/15">
            <Ionicons name="cloud-upload-outline" size={28} color="#FF6B00" />
          </View>
          <Text className="mt-3 font-bold text-text">Drag and drop media files</Text>
          <Text className="mt-1 text-xs text-text-secondary">Supports JPG, PNG, MP4 up to 50MB</Text>
          <ScaledPressable onPress={pickFiles} className="mt-4 rounded-lg bg-primary px-6 py-3">
            <Text className="font-bold text-text-inverse">Select Files</Text>
          </ScaledPressable>
        </Animated.View>

        {uploads.length > 0 && (
          <View className="mt-4 flex-row flex-wrap gap-2">
            {uploads.map((uri) => (
              <Image key={uri} source={{ uri }} style={{ width: 72, height: 72, borderRadius: 8 }} />
            ))}
          </View>
        )}

        <View className="mt-6 gap-3">
          <ScaledPressable
            onPress={() => router.push('/support/chat')}
            className="flex-row items-center justify-between rounded-card border border-border bg-surface p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-trust">
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FF6B00" />
              </View>
              <View>
                <Text className="text-sm font-bold text-text">Live Chat</Text>
                <Text className="text-xs text-success">Response in &lt; 2 min</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </ScaledPressable>
          <ScaledPressable
            onPress={() => Linking.openURL('tel:+919999999999')}
            className="flex-row items-center justify-between rounded-card border border-border bg-surface p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-lg bg-trust">
                <Ionicons name="call-outline" size={20} color="#FF6B00" />
              </View>
              <View>
                <Text className="text-sm font-bold text-text">Call Support</Text>
                <Text className="text-xs text-success">Direct Line Available</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#999" />
          </ScaledPressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
