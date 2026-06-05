import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedProgressBar } from '@components/AnimatedProgressBar';
import { ScaledPressable } from '@components/ScaledPressable';
import { useOrderStore } from '@store/orderStore';
import { navigateFromModal, safeGoBack } from '@utils/navigation';

type VoiceState = 'idle' | 'listening' | 'processing' | 'result';

const BAR_COUNT = 20;

const QUICK_COMMANDS = [
  '४० बोरी सीमेंट ऑर्डर करें',
  'मेरा पिछला ऑर्डर ट्रैक करें',
  'स्टील का भाव क्या है?',
  'Check steel prices',
  'Track my order',
  'Order cement bags',
  'Emergency delivery',
];

const HINTS = [
  '"Check cement availability at Bandra site"',
  '"Order 50 bags UltraTech cement"',
  '"Track my last order"',
  '"Steel prices today"',
];

interface VoiceResult {
  actionText: string;
  primaryLabel: string;
  primaryRoute: string;
  secondaryLabel: string;
  secondaryRoute: string;
}

function getResultForTranscript(text: string): VoiceResult {
  const lower = text.toLowerCase();
  if (lower.includes('track') || lower.includes('ऑर्डर ट्रैक')) {
    return {
      actionText: 'Your latest order CIQ-88294 is en route — arriving by 4:15 PM',
      primaryLabel: 'Track Live →',
      primaryRoute: '/orders/details/CIQ-88294',
      secondaryLabel: 'View Order',
      secondaryRoute: '/orders/view/CIQ-88294',
    };
  }
  if (lower.includes('steel') || lower.includes('स्टील')) {
    return {
      actionText: 'JSW Neosteel TMT 12mm — ₹58,450/ton (bulk discount available)',
      primaryLabel: 'View Steel →',
      primaryRoute: '/(tabs)/catalog',
      secondaryLabel: 'Order Now',
      secondaryRoute: '/products/2',
    };
  }
  if (lower.includes('emergency')) {
    return {
      actionText: 'Emergency delivery slot available — Today 4:00 PM at your site',
      primaryLabel: 'Book Slot →',
      primaryRoute: '/(tabs)',
      secondaryLabel: 'Call Support',
      secondaryRoute: '/support',
    };
  }
  if (lower.includes('order') || lower.includes('ऑर्डर') || lower.includes('cement') || lower.includes('सीमेंट')) {
    return {
      actionText: 'UltraTech Premium Cement — 1,240 bags in stock at Thane Hub',
      primaryLabel: 'Order Now →',
      primaryRoute: '/products/detail/1',
      secondaryLabel: 'View Catalog',
      secondaryRoute: '/(tabs)/catalog',
    };
  }
  return {
    actionText: 'Cement is available — 1,240 bags in stock at Bandra site',
    primaryLabel: 'View Catalog →',
    primaryRoute: '/(tabs)/catalog',
    secondaryLabel: 'Order Now',
    secondaryRoute: '/products/detail/1',
  };
}

function WaveformBar({
  index,
  isListening,
  isProcessing,
}: {
  index: number;
  isListening: boolean;
  isProcessing: boolean;
}) {
  const height = useSharedValue(4);

  useEffect(() => {
    cancelAnimation(height);
    if (isListening) {
      const target = Math.random() * 28 + 6;
      height.value = withRepeat(
        withSequence(
          withDelay(
            index * 40,
            withTiming(target, { duration: 300 + Math.random() * 200 }),
          ),
          withTiming(4, { duration: 300 }),
        ),
        -1,
        true,
      );
    } else if (isProcessing) {
      height.value = withRepeat(
        withSequence(
          withDelay(index * 30, withTiming(20 + (index % 5) * 3, { duration: 400 })),
          withTiming(6, { duration: 400 }),
        ),
        -1,
        true,
      );
    } else {
      height.value = withTiming(4, { duration: 200 });
    }
    return () => cancelAnimation(height);
  }, [height, index, isListening, isProcessing]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        styles.bar,
        barStyle,
        { backgroundColor: isListening || isProcessing ? '#FF6B00' : '#CCCCCC' },
      ]}
    />
  );
}

function QuickCommandChip({
  label,
  index,
  onPress,
}: {
  label: string;
  index: number;
  onPress: () => void;
}) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(24);
  const scale = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(index * 60, withTiming(1, { duration: 200 }));
    translateX.value = withDelay(index * 60, withSpring(0, { damping: 16, stiffness: 120 }));
  }, [index, opacity, translateX]);

  const chipStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const handlePress = async () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 8, stiffness: 300 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    await Haptics.selectionAsync();
    onPress();
  };

  return (
    <Animated.View style={chipStyle}>
      <Pressable onPress={handlePress} style={styles.chip}>
        <Text style={styles.chipText}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function VoiceAssistantScreen() {
  const orders = useOrderStore((s) => s.orders);
  const activeOrder = orders.find(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled',
  );

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [hintIndex, setHintIndex] = useState(0);
  const [result, setResult] = useState<VoiceResult | null>(null);

  const listenTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const processTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const ring1Scale = useSharedValue(1);
  const ring2Scale = useSharedValue(1);
  const ring3Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.25);
  const ring2Opacity = useSharedValue(0.15);
  const ring3Opacity = useSharedValue(0.08);
  const micScale = useSharedValue(1);
  const micRotation = useSharedValue(0);
  const textOpacity = useSharedValue(1);
  const hintOpacity = useSharedValue(1);
  const resultTranslateY = useSharedValue(200);
  const resultOpacity = useSharedValue(0);
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);
  const connectionPulse = useSharedValue(1);

  const startPulse = useCallback(() => {
    ring1Scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 600, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    ring2Scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    ring3Scale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 1000, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.in(Easing.ease) }),
      ),
      -1,
      false,
    );
    ring1Opacity.value = withRepeat(
      withSequence(withTiming(0.5, { duration: 600 }), withTiming(0.25, { duration: 600 })),
      -1,
      false,
    );
    ring2Opacity.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 800 }), withTiming(0.15, { duration: 800 })),
      -1,
      false,
    );
    ring3Opacity.value = withRepeat(
      withSequence(withTiming(0.15, { duration: 1000 }), withTiming(0.08, { duration: 1000 })),
      -1,
      false,
    );
  }, [ring1Opacity, ring1Scale, ring2Opacity, ring2Scale, ring3Opacity, ring3Scale]);

  const stopPulse = useCallback(() => {
    cancelAnimation(ring1Scale);
    cancelAnimation(ring2Scale);
    cancelAnimation(ring3Scale);
    cancelAnimation(ring1Opacity);
    cancelAnimation(ring2Opacity);
    cancelAnimation(ring3Opacity);
    ring1Scale.value = withTiming(1, { duration: 300 });
    ring2Scale.value = withTiming(1, { duration: 300 });
    ring3Scale.value = withTiming(1, { duration: 300 });
    ring1Opacity.value = withTiming(0.25, { duration: 300 });
    ring2Opacity.value = withTiming(0.15, { duration: 300 });
    ring3Opacity.value = withTiming(0.08, { duration: 300 });
  }, [ring1Opacity, ring1Scale, ring2Opacity, ring2Scale, ring3Opacity, ring3Scale]);

  const startProcessingDots = useCallback(() => {
    micRotation.value = withRepeat(withTiming(360, { duration: 1200 }), -1, false);
    const bounce = withRepeat(
      withSequence(withTiming(-8, { duration: 300 }), withTiming(0, { duration: 300 })),
      -1,
    );
    dot1.value = bounce;
    dot2.value = withDelay(100, bounce);
    dot3.value = withDelay(200, bounce);
  }, [dot1, dot2, dot3, micRotation]);

  const stopProcessingDots = useCallback(() => {
    cancelAnimation(micRotation);
    cancelAnimation(dot1);
    cancelAnimation(dot2);
    cancelAnimation(dot3);
    micRotation.value = withTiming(0, { duration: 200 });
    dot1.value = withTiming(0, { duration: 150 });
    dot2.value = withTiming(0, { duration: 150 });
    dot3.value = withTiming(0, { duration: 150 });
  }, [dot1, dot2, dot3, micRotation]);

  const showResultCard = useCallback(
    (text: string) => {
      const res = getResultForTranscript(text);
      setResult(res);
      setVoiceState('result');
      resultTranslateY.value = withSpring(0, { damping: 18, stiffness: 120 });
      resultOpacity.value = withTiming(1, { duration: 250 });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [resultOpacity, resultTranslateY],
  );

  const runProcessing = useCallback(
    (text: string) => {
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
      stopPulse();
      setVoiceState('processing');
      startProcessingDots();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      processTimeoutRef.current = setTimeout(() => {
        stopProcessingDots();
        setTranscript(text);
        showResultCard(text);
      }, 1500);
    },
    [showResultCard, startProcessingDots, stopProcessingDots, stopPulse],
  );

  const startListening = useCallback(
    (autoText?: string) => {
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
      if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
      stopProcessingDots();
      resultTranslateY.value = 200;
      resultOpacity.value = 0;
      setResult(null);

      textOpacity.value = withSequence(withTiming(0, { duration: 150 }), withTiming(1, { duration: 200 }));
      setVoiceState('listening');
      startPulse();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      listenTimeoutRef.current = setTimeout(() => {
        runProcessing(autoText ?? 'Check cement availability');
      }, 3000);
    },
    [
      runProcessing,
      resultOpacity,
      resultTranslateY,
      startPulse,
      stopProcessingDots,
      textOpacity,
    ],
  );

  const stopListening = useCallback(() => {
    if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
    runProcessing(transcript || 'Check cement availability');
  }, [runProcessing, transcript]);

  const onMicPress = async () => {
    micScale.value = withSequence(
      withSpring(0.9, { damping: 6, stiffness: 300 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );
    if (voiceState === 'idle' || voiceState === 'result') {
      startListening();
    } else if (voiceState === 'listening') {
      stopListening();
    }
  };

  const onChipPress = (chipText: string) => {
    setTranscript(chipText);
    textOpacity.value = withSequence(withTiming(0, { duration: 150 }), withTiming(1, { duration: 200 }));
    runProcessing(chipText);
  };

  const handleDismiss = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    safeGoBack();
  };

  const navigateAndClose = (href: string) => {
    navigateFromModal(href as never);
  };

  useEffect(() => {
    connectionPulse.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 750 }), withTiming(1, { duration: 750 })),
      -1,
    );
    return () => cancelAnimation(connectionPulse);
  }, [connectionPulse]);

  useEffect(() => {
    return () => {
      if (listenTimeoutRef.current) clearTimeout(listenTimeoutRef.current);
      if (processTimeoutRef.current) clearTimeout(processTimeoutRef.current);
      stopPulse();
      stopProcessingDots();
      cancelAnimation(micScale);
      cancelAnimation(textOpacity);
      cancelAnimation(hintOpacity);
      cancelAnimation(resultTranslateY);
      cancelAnimation(resultOpacity);
      cancelAnimation(connectionPulse);
    };
  }, [stopProcessingDots, stopPulse]);

  useEffect(() => {
    const interval = setInterval(() => {
      hintOpacity.value = withSequence(
        withTiming(0, { duration: 200 }),
        withTiming(1, { duration: 300 }),
      );
      setHintIndex((i) => (i + 1) % HINTS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [hintOpacity]);

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opacity.value,
  }));
  const micBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: micScale.value }, { rotate: `${micRotation.value}deg` }],
  }));
  const statusTextStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));
  const hintStyle = useAnimatedStyle(() => ({ opacity: hintOpacity.value }));
  const resultStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: resultTranslateY.value }],
    opacity: resultOpacity.value,
  }));
  const dot1Style = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const dot2Style = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const dot3Style = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));
  const connectionDotStyle = useAnimatedStyle(() => ({
    opacity: connectionPulse.value,
  }));

  const statusText =
    voiceState === 'idle'
      ? 'Tap to speak'
      : voiceState === 'listening'
        ? 'सुन रहे हैं…\nListening for your command'
        : voiceState === 'processing'
          ? 'Processing…'
          : '';

  const orderDescription = activeOrder
    ? `${activeOrder.quantitySummary} ${activeOrder.productName} dispatched to ${activeOrder.deliverySite.name}.`
    : '';

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          headerShown: false,
          gestureEnabled: true,
          gestureDirection: 'vertical',
        }}
      />

      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <View style={styles.glow} />

        <View style={styles.body}>
        <View style={styles.header}>
          <ScaledPressable onPress={handleDismiss} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FF6B00" />
          </ScaledPressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Voice Assistant</Text>
            <View style={styles.connectionRow}>
              <Animated.View style={[styles.connectionDot, connectionDotStyle]} />
              <Text style={styles.connectionLabel}>Active Connection</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.micSection}>
          <View style={styles.ringsContainer}>
            <Animated.View style={[styles.ringOuter, ring3Style]} />
            <Animated.View style={[styles.ringMiddle, ring2Style]} />
            <Animated.View style={[styles.ringInner, ring1Style]} />
            <Pressable onPress={onMicPress}>
              <Animated.View style={[styles.micButton, micBtnStyle]}>
                <Ionicons name="mic" size={32} color="#FFFFFF" />
              </Animated.View>
            </Pressable>
          </View>

          <Animated.View style={statusTextStyle}>
            {voiceState === 'listening' ? (
              <View style={styles.statusBlock}>
                <Text style={styles.statusHindi}>सुन रहे हैं…</Text>
                <Text style={styles.statusEnglish}>Listening for your command</Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.statusSingle,
                  voiceState === 'idle' && styles.statusIdle,
                  voiceState === 'processing' && styles.statusActive,
                ]}>
                {statusText}
              </Text>
            )}
          </Animated.View>

          {voiceState === 'processing' && (
            <View style={styles.dotsRow}>
              <Animated.View style={[styles.dot, dot1Style]} />
              <Animated.View style={[styles.dot, dot2Style]} />
              <Animated.View style={[styles.dot, dot3Style]} />
            </View>
          )}

          <View style={styles.waveform}>
            {Array.from({ length: BAR_COUNT }, (_, i) => (
              <WaveformBar
                key={i}
                index={i}
                isListening={voiceState === 'listening'}
                isProcessing={voiceState === 'processing'}
              />
            ))}
          </View>
        </View>

        {activeOrder && (
          <View style={styles.orderCard}>
            <View style={styles.orderCardHeader}>
              <Ionicons name="bus-outline" size={20} color="#FF6B00" />
              <View style={styles.enRouteBadge}>
                <Text style={styles.enRouteText}>EN ROUTE</Text>
              </View>
            </View>
            <Text style={styles.orderTitle}>Latest Order</Text>
            <Text style={styles.orderDesc}>{orderDescription}</Text>
            <View style={styles.progressWrap}>
              <AnimatedProgressBar progress={0.7} height={6} />
            </View>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={styles.chipsContainer}>
          {QUICK_COMMANDS.map((cmd, i) => (
            <QuickCommandChip key={cmd} label={cmd} index={i} onPress={() => onChipPress(cmd)} />
          ))}
        </ScrollView>

        {voiceState === 'result' && result && (
          <Animated.View style={[styles.resultCard, resultStyle]}>
            <Text style={styles.heardLabel}>I heard:</Text>
            <Text style={styles.transcript}>"{transcript}"</Text>
            <View style={styles.actionRow}>
              <Ionicons name="cube-outline" size={20} color="#FF6B00" />
              <Text style={styles.actionText}>{result.actionText}</Text>
            </View>
            <View style={styles.resultButtons}>
              <Pressable
                style={styles.primaryBtn}
                onPress={() => navigateAndClose(result.primaryRoute)}>
                <Text style={styles.primaryBtnText}>{result.primaryLabel}</Text>
              </Pressable>
              <Pressable
                style={styles.secondaryBtn}
                onPress={() => navigateAndClose(result.secondaryRoute)}>
                <Text style={styles.secondaryBtnText}>{result.secondaryLabel}</Text>
              </Pressable>
            </View>
          </Animated.View>
        )}

        </View>

        <Animated.View style={[styles.hintRow, hintStyle]}>
          <Ionicons name="mic-outline" size={14} color="#999999" />
          <Text style={styles.hintText}>Try saying: {HINTS[hintIndex]}</Text>
        </Animated.View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  body: {
    flex: 1,
  },
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#FF6B00',
    opacity: 0.04,
    alignSelf: 'center',
    top: '18%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    marginBottom: 16,
  },
  backBtn: {
    padding: 4,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF6B00',
  },
  connectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#388E3C',
  },
  connectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#388E3C',
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  micSection: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  ringsContainer: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ringOuter: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FF6B00',
    opacity: 0.08,
  },
  ringMiddle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6B00',
    opacity: 0.2,
  },
  ringInner: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FF6B00',
    opacity: 0.25,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  statusBlock: {
    alignItems: 'center',
    marginBottom: 12,
  },
  statusHindi: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B00',
  },
  statusEnglish: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
  },
  statusSingle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusIdle: {
    color: '#999999',
  },
  statusActive: {
    color: '#FF6B00',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B00',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 40,
    marginTop: 8,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
  orderCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  enRouteBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  enRouteText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF6B00',
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  orderDesc: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 12,
  },
  progressWrap: {
    marginTop: 4,
  },
  chipsContainer: {
    marginTop: 16,
    maxHeight: 44,
  },
  chipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    color: '#666666',
  },
  resultCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFF8F3',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFE0CC',
  },
  heardLabel: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  transcript: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 14,
    color: '#444444',
    lineHeight: 20,
  },
  resultButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#FF6B00',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FF6B00',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#FF6B00',
    fontWeight: '700',
    fontSize: 14,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  hintText: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
    flexShrink: 1,
  },
});
