import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { StringKey } from '@constants/strings';
import { useTranslation } from '@store/languageStore';

type VoiceState = 'idle' | 'listening' | 'processing' | 'result';

export interface VoiceSearchResult {
  title: string;
  body: string;
  actionLabel: string;
  navigateTo: Href;
}

export const voiceSheetRef = createRef<BottomSheetModal>();

export const openVoiceAssistant = () => {
  voiceSheetRef.current?.present();
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'] as const;
const SNAP_POINTS = ['55%', '90%'] as const;

const STATUS_MESSAGE_KEYS: Record<VoiceState, StringKey> = {
  idle: 'searchBajriwala',
  listening: 'listening',
  processing: 'findingResults',
  result: 'hereIsWhatIFound',
};

const SUGGESTION_KEYS: {
  icon: 'cube-outline' | 'trending-up' | 'location-outline' | 'flash-outline';
  textKey: StringKey;
  color: string;
}[] = [
  { icon: 'cube-outline', textKey: 'orderCementBags', color: '#4285F4' },
  { icon: 'trending-up', textKey: 'steelPricesToday', color: '#EA4335' },
  { icon: 'location-outline', textKey: 'trackMyOrder', color: '#FBBC05' },
  { icon: 'flash-outline', textKey: 'emergencyDelivery', color: '#34A853' },
];

function getResultForQuery(text: string): VoiceSearchResult {
  const lower = text.toLowerCase();
  if (lower.includes('track') || lower.includes('order') || lower.includes('ऑर्डर')) {
    return {
      title: 'Order BJW-88294 En Route',
      body: 'Your latest order is on the way — arriving by 4:15 PM today.',
      actionLabel: 'Track Live →',
      navigateTo: '/orders/details/BJW-88294' as Href,
    };
  }
  if (lower.includes('steel') || lower.includes('price') || lower.includes('स्टील')) {
    return {
      title: 'Steel Prices Today',
      body: 'JSW Neosteel TMT 12mm — ₹58,450/ton. Bulk discount available.',
      actionLabel: 'View Steel →',
      navigateTo: '/products/2' as Href,
    };
  }
  if (lower.includes('emergency') || lower.includes('urgent')) {
    return {
      title: 'Emergency Delivery Available',
      body: 'Next slot: Today, 4:00 PM at your site. 90-minute dispatch guaranteed.',
      actionLabel: 'Book Slot →',
      navigateTo: '/emergency-order' as Href,
    };
  }
  if (lower.includes('cement') || lower.includes('bag')) {
    return {
      title: 'Cement Available',
      body: 'Live inventory is synced for your location. Delivery ETA updates automatically based on your address.',
      actionLabel: 'View Catalog →',
      navigateTo: '/(tabs)/catalog' as Href,
    };
  }
  return {
    title: 'Bajriwala',
    body: 'Search cement, steel, sand & more. 90-minute delivery to your site.',
    actionLabel: 'Browse Catalog →',
    navigateTo: '/(tabs)/catalog' as Href,
  };
}

function WaveformBar({
  color,
  index,
  state,
}: {
  color: string;
  index: number;
  state: VoiceState;
}) {
  const height = useSharedValue(4);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    cancelAnimation(height);
    cancelAnimation(opacity);

    if (state === 'listening') {
      const peak = 28 + ((index * 9) % 18);
      height.value = withRepeat(
        withSequence(
          withDelay(
            index * 120,
            withTiming(peak, { duration: 400, easing: Easing.out(Easing.sin) }),
          ),
          withTiming(6, { duration: 400, easing: Easing.in(Easing.sin) }),
        ),
        -1,
        true,
      );
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      height.value = withSpring(4, { damping: 14, stiffness: 120 });
      opacity.value = withTiming(0.5, { duration: 250 });
    }

    return () => {
      cancelAnimation(height);
      cancelAnimation(opacity);
    };
  }, [height, index, opacity, state]);

  const barStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.waveBar, { backgroundColor: color }, barStyle]} />;
}

function ProcessingOrbit({ state }: { state: VoiceState }) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (state === 'processing') {
      rotation.value = withRepeat(
        withTiming(360, { duration: 1400, easing: Easing.linear }),
        -1,
        false,
      );
      scale.value = withRepeat(
        withSequence(withTiming(1.1, { duration: 700 }), withTiming(0.9, { duration: 700 })),
        -1,
        true,
      );
    } else {
      cancelAnimation(rotation);
      cancelAnimation(scale);
      rotation.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
    }

    return () => {
      cancelAnimation(rotation);
      cancelAnimation(scale);
    };
  }, [rotation, scale, state]);

  const orbitStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  if (state !== 'processing') return null;

  return (
    <View style={styles.orbitContainer}>
      <Animated.View style={[styles.orbitRing, orbitStyle]}>
        {GOOGLE_COLORS.map((color, i) => {
          const angle = (i / GOOGLE_COLORS.length) * 2 * Math.PI;
          const radius = 22;
          return (
            <View
              key={color}
              style={[
                styles.orbitDot,
                {
                  backgroundColor: color,
                  left: 30 + radius * Math.cos(angle) - 4,
                  top: 30 + radius * Math.sin(angle) - 4,
                },
              ]}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

function ColorWaveform({ state }: { state: VoiceState }) {
  if (state === 'processing') {
    return <ProcessingOrbit state={state} />;
  }

  return (
    <View style={styles.waveform}>
      {GOOGLE_COLORS.map((color, i) => (
        <WaveformBar key={color} color={color} index={i} state={state} />
      ))}
    </View>
  );
}

function MicButton({ state, onPress }: { state: VoiceState; onPress: () => void }) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const labelOpacity = useSharedValue(1);
  const isListening = state === 'listening';

  useEffect(() => {
    if (isListening) {
      glowOpacity.value = withRepeat(
        withSequence(withTiming(0.45, { duration: 800 }), withTiming(0.08, { duration: 800 })),
        -1,
        false,
      );
      glowScale.value = withRepeat(
        withSequence(withSpring(1.55, { damping: 8 }), withSpring(1.0, { damping: 8 })),
        -1,
        false,
      );
    } else {
      cancelAnimation(glowOpacity);
      cancelAnimation(glowScale);
      glowOpacity.value = withTiming(0, { duration: 200 });
      glowScale.value = withTiming(1, { duration: 200 });
    }

    labelOpacity.value = withSequence(
      withTiming(0, { duration: 100 }),
      withTiming(1, { duration: 180 }),
    );

    return () => {
      cancelAnimation(glowOpacity);
      cancelAnimation(glowScale);
    };
  }, [glowOpacity, glowScale, isListening, labelOpacity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const buttonWrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.88, { damping: 6, stiffness: 400 }),
      withSpring(1.0, { damping: 8, stiffness: 200 }),
    );
    void Haptics.impactAsync(
      state === 'idle' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
    );
    onPress();
  };

  return (
    <View style={styles.micSection}>
      <Animated.View
        style={[
          styles.micGlow,
          { backgroundColor: isListening ? '#FEB623' : '#4285F4' },
          glowStyle,
        ]}
      />
      <Animated.View style={buttonWrapStyle}>
        <Pressable
          onPress={handlePress}
          style={[
            styles.micButton,
            isListening ? styles.micButtonActive : styles.micButtonIdle,
          ]}>
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={28}
            color={isListening ? '#fff' : 'rgba(255,255,255,0.85)'}
          />
        </Pressable>
      </Animated.View>
      <Animated.Text
        style={[
          styles.micLabel,
          isListening && styles.micLabelActive,
          labelStyle,
        ]}>
        {isListening ? t('listening') : t('tapToSpeak')}
      </Animated.Text>
    </View>
  );
}

function QuickSuggestions({ onSelect }: { onSelect: (text: string) => void }) {
  const { t } = useTranslation();

  return (
    <Animated.View entering={FadeInDown.delay(200).duration(400)}>
      <Text style={styles.suggestionsHeading}>{t('trySaying')}</Text>
      <View style={styles.suggestionsWrap}>
        {SUGGESTION_KEYS.map((item, index) => {
          const text = t(item.textKey);
          return (
            <Animated.View key={item.textKey} entering={FadeIn.delay(280 + index * 70).duration(300)}>
              <Pressable
                onPress={() => {
                  void Haptics.selectionAsync();
                  onSelect(text);
                }}
                style={styles.suggestionChip}>
                <Ionicons name={item.icon} size={14} color={item.color} />
                <Text style={styles.suggestionText}>{text}</Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
    </Animated.View>
  );
}

function ResultCard({
  result,
  onTryAgain,
  onNavigate,
}: {
  result: VoiceSearchResult;
  onTryAgain: () => void;
  onNavigate: () => void;
}) {
  const { t } = useTranslation();
  const translateY = useSharedValue(48);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 18, stiffness: 110 });
    opacity.value = withTiming(1, { duration: 320 });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(opacity);
    };
  }, [opacity, translateY]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.duration(350)} style={[styles.resultCard, cardStyle]}>
      <View style={styles.resultHeader}>
        <View style={styles.resultIcon}>
          <Ionicons name="cube-outline" size={18} color="#fff" />
        </View>
        <View style={styles.resultHeaderText}>
          <Text style={styles.resultLabel}>{t('result')}</Text>
          <Text style={styles.resultTitle}>{result.title}</Text>
        </View>
      </View>

      <Text style={styles.resultBody}>{result.body}</Text>

      <View style={styles.resultActions}>
        <Pressable onPress={onNavigate} style={styles.resultPrimary}>
          <Text style={styles.resultPrimaryText}>{result.actionLabel}</Text>
        </Pressable>
        <Pressable onPress={onTryAgain} style={styles.resultSecondary}>
          <Text style={styles.resultSecondaryText}>{t('tryAgain')}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

export function VoiceAssistantSheet() {
  const { t } = useTranslation();
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<VoiceSearchResult | null>(null);
  const [isPresented, setIsPresented] = useState(false);

  const voiceStateRef = useRef<VoiceState>('idle');
  const listeningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const textOpacity = useSharedValue(1);
  const transcriptOpacity = useSharedValue(0);
  const transcriptScale = useSharedValue(0.94);
  const contentOpacity = useSharedValue(0);

  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    if (voiceState === 'result') {
      voiceSheetRef.current?.snapToIndex(1);
    }
  }, [voiceState]);

  const statusAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const transcriptAnimatedStyle = useAnimatedStyle(() => ({
    opacity: transcriptOpacity.value,
    transform: [{ scale: transcriptScale.value }],
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const clearTimers = useCallback(() => {
    if (listeningTimerRef.current) clearTimeout(listeningTimerRef.current);
    if (processingTimerRef.current) clearTimeout(processingTimerRef.current);
    if (openTimerRef.current) clearTimeout(openTimerRef.current);
    listeningTimerRef.current = null;
    processingTimerRef.current = null;
    openTimerRef.current = null;
  }, []);

  const changeState = useCallback(
    (newState: VoiceState) => {
      textOpacity.value = withSequence(
        withTiming(0, { duration: 120 }),
        withTiming(1, { duration: 200 }),
      );
      setVoiceState(newState);
    },
    [textOpacity],
  );

  const showTranscript = useCallback(
    (text: string) => {
      setTranscript(text);
      transcriptOpacity.value = withTiming(1, { duration: 240 });
      transcriptScale.value = withSpring(1, { damping: 14, stiffness: 160 });
    },
    [transcriptOpacity, transcriptScale],
  );

  const hideTranscript = useCallback(() => {
    transcriptOpacity.value = withTiming(0, { duration: 150 });
    transcriptScale.value = withTiming(0.94, { duration: 150 });
    setTranscript('');
  }, [transcriptOpacity, transcriptScale]);

  const runProcessing = useCallback(
    (query: string) => {
      showTranscript(query);
      changeState('processing');
      clearTimers();
      processingTimerRef.current = setTimeout(() => {
        setResult(getResultForQuery(query));
        changeState('result');
      }, 1500);
    },
    [changeState, clearTimers, showTranscript],
  );

  const startAutoListen = useCallback(() => {
    clearTimers();
    listeningTimerRef.current = setTimeout(() => {
      if (voiceStateRef.current === 'listening') {
        runProcessing('Check cement availability');
      }
    }, 3000);
  }, [clearTimers, runProcessing]);

  const resetAll = useCallback(() => {
    clearTimers();
    cancelAnimation(textOpacity);
    cancelAnimation(transcriptOpacity);
    cancelAnimation(transcriptScale);
    cancelAnimation(contentOpacity);
    textOpacity.value = 1;
    transcriptOpacity.value = 0;
    transcriptScale.value = 0.94;
    contentOpacity.value = 0;
    hideTranscript();
    setResult(null);
    setVoiceState('idle');
    voiceSheetRef.current?.snapToIndex(0);
  }, [clearTimers, contentOpacity, hideTranscript, textOpacity, transcriptOpacity, transcriptScale]);

  const handleDismiss = useCallback(() => {
    resetAll();
    setIsPresented(false);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [resetAll]);

  const handleSheetChange = useCallback(
    (index: number) => {
      const presented = index >= 0;
      setIsPresented(presented);
      if (presented) {
        contentOpacity.value = withDelay(200, withTiming(1, { duration: 350 }));
      }
    },
    [contentOpacity],
  );

  useEffect(() => {
    if (!isPresented) {
      resetAll();
      return;
    }

    openTimerRef.current = setTimeout(() => {
      changeState('listening');
      startAutoListen();
    }, 600);

    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
    };
  }, [changeState, isPresented, resetAll, startAutoListen]);

  const handleMicPress = useCallback(() => {
    if (voiceStateRef.current === 'idle') {
      changeState('listening');
      startAutoListen();
      return;
    }

    if (voiceStateRef.current === 'listening') {
      clearTimers();
      runProcessing(transcript || 'Check cement availability');
      return;
    }

    if (voiceStateRef.current === 'result' || voiceStateRef.current === 'processing') {
      hideTranscript();
      setResult(null);
      changeState('idle');
      voiceSheetRef.current?.snapToIndex(0);
    }
  }, [changeState, clearTimers, hideTranscript, runProcessing, startAutoListen, transcript]);

  const handleSuggestion = useCallback(
    (text: string) => {
      showTranscript(text);
      changeState('listening');
      clearTimers();
      listeningTimerRef.current = setTimeout(() => {
        runProcessing(text);
      }, 2000);
    },
    [changeState, clearTimers, runProcessing, showTranscript],
  );

  const handleTryAgain = useCallback(() => {
    hideTranscript();
    setResult(null);
    changeState('idle');
    voiceSheetRef.current?.snapToIndex(0);
  }, [changeState, hideTranscript]);

  const handleNavigate = useCallback(() => {
    if (!result) return;
    voiceSheetRef.current?.dismiss();
    router.push(result.navigateTo);
  }, [result]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.6}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={voiceSheetRef}
      snapPoints={[...SNAP_POINTS]}
      enablePanDownToClose
      enableDynamicSizing={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
      onDismiss={handleDismiss}
      onChange={handleSheetChange}>
      <BottomSheetScrollView
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <Animated.View style={contentAnimatedStyle}>
          <Pressable
            onPress={() => voiceSheetRef.current?.dismiss()}
            style={styles.closeButton}
            hitSlop={8}>
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>

          <Animated.Text style={[styles.statusText, statusAnimatedStyle]}>
            {t(STATUS_MESSAGE_KEYS[voiceState])}
          </Animated.Text>

          {transcript.length > 0 && (
            <Animated.Text style={[styles.transcript, transcriptAnimatedStyle]}>
              &ldquo;{transcript}&rdquo;
            </Animated.Text>
          )}

          <ColorWaveform state={voiceState} />
          <MicButton state={voiceState} onPress={handleMicPress} />

          {voiceState === 'idle' && <QuickSuggestions onSelect={handleSuggestion} />}

          {voiceState === 'result' && result && (
            <ResultCard
              result={result}
              onTryAgain={handleTryAgain}
              onNavigate={handleNavigate}
            />
          )}
        </Animated.View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#0A0A0A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleIndicator: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: 40,
    height: 4,
  },
  sheetContent: {
    flexGrow: 1,
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 24,
    paddingBottom: 40,
    minHeight: 420,
  },
  closeButton: {
    position: 'absolute',
    top: 4,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  statusText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 28,
    letterSpacing: 0.3,
  },
  transcript: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 30,
    paddingHorizontal: 8,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 60,
    marginBottom: 28,
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
  },
  orbitContainer: {
    height: 60,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbitRing: {
    width: 60,
    height: 60,
    position: 'relative',
  },
  orbitDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  micSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  micGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    top: -4,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  micButtonIdle: {
    backgroundColor: '#1E1E1E',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#4285F4',
  },
  micButtonActive: {
    backgroundColor: '#FEB623',
    shadowColor: '#FEB623',
  },
  micLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 10,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  micLabelActive: {
    color: '#FEB623',
  },
  suggestionsHeading: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 14,
  },
  suggestionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  suggestionText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  resultHeaderText: {
    flex: 1,
  },
  resultIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEB623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  resultTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  resultBody: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
  },
  resultPrimary: {
    flex: 1,
    backgroundColor: '#FEB623',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  resultPrimaryText: {
    color: '#1A1A1A',
    fontWeight: '700',
    fontSize: 14,
  },
  resultSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  resultSecondaryText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});
