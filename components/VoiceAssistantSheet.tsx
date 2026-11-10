import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import { AppState, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetTextInput,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { useSpeechCapture } from '@hooks/useSpeechCapture';
import {
  resolveVoiceSearch,
  transcribeVoiceRecording,
  type VoiceNavigation,
  type VoiceSearchResolution,
} from '@services/voiceSearch.api';
import {
  isExpoGo,
  recognitionLanguage,
  SpeechCaptureError,
} from '@services/speech/speechCapture';
import { theme } from '@constants/theme';
import { useEtaStore } from '@store/etaStore';
import { useTranslation } from '@store/languageStore';

type VoicePhase =
  | 'idle'
  | 'listening'
  | 'recording'
  | 'transcribing'
  | 'searching'
  | 'clarify'
  | 'no_results'
  | 'error';

export const voiceSheetRef = createRef<BottomSheetModal>();

export const openVoiceAssistant = () => {
  voiceSheetRef.current?.present();
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

const SNAP_POINTS = ['58%', '88%'] as const;
const LISTEN_TIMEOUT_MS = 12000;
const RECORD_TIMEOUT_MS = 8000;

const SUGGESTIONS = ['voiceSuggestCement', 'voiceSuggestBricks', 'voiceSuggestUltraTech'] as const;

function openNavigation(nav: VoiceNavigation) {
  if (nav.type === 'category_listing' && (nav.categoryId || nav.categorySlug)) {
    router.push({
      pathname: '/products/[categoryId]',
      params: {
        categoryId: nav.categoryId || nav.categorySlug || '',
        categorySlug: nav.categorySlug || nav.categoryId || '',
        categoryName: nav.categoryName || '',
        ...(nav.brand ? { brand: nav.brand } : {}),
        ...(nav.search ? { search: nav.search } : {}),
        ...(nav.minPrice != null ? { minPrice: String(nav.minPrice) } : {}),
        ...(nav.maxPrice != null ? { maxPrice: String(nav.maxPrice) } : {}),
      },
    } as Href);
    return;
  }

  if (nav.type === 'product_detail' && (nav.productSlug || nav.productId)) {
    router.push({
      pathname: '/products/detail/[productId]',
      params: {
        productId: nav.productSlug || nav.productId || '',
        categoryId: nav.categorySlug || nav.categoryId || '',
        categoryName: nav.categoryName || '',
      },
    } as Href);
    return;
  }

  if (nav.type === 'search' && nav.query) {
    router.push({ pathname: '/search', params: { q: nav.query } } as Href);
  }
}

function Waveform({ active, level }: { active: boolean; level: number }) {
  return (
    <View style={styles.waveform}>
      {[0, 1, 2, 3, 4].map((index) => (
        <WaveBar key={index} index={index} active={active} level={level} />
      ))}
    </View>
  );
}

function WaveBar({ index, active, level }: { index: number; active: boolean; level: number }) {
  const height = useSharedValue(6);

  useEffect(() => {
    cancelAnimation(height);
    if (!active) {
      height.value = withTiming(6, { duration: 180 });
      return;
    }
    const peak = 16 + ((index * 7) % 18) + level * 22;
    height.value = withRepeat(
      withSequence(
        withTiming(peak, { duration: 280 + index * 40, easing: Easing.out(Easing.sin) }),
        withTiming(8, { duration: 280, easing: Easing.in(Easing.sin) }),
      ),
      -1,
      true,
    );
    return () => cancelAnimation(height);
  }, [active, height, index, level]);

  const style = useAnimatedStyle(() => ({ height: height.value }));
  return <Animated.View style={[styles.waveBar, style]} />;
}

export function VoiceAssistantSheet() {
  const { t, language } = useTranslation();
  const speech = useSpeechCapture();
  const latitude = useEtaStore((s) => s.latitude);
  const longitude = useEtaStore((s) => s.longitude);
  const pincode = useEtaStore((s) => s.pincode);

  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [transcript, setTranscript] = useState('');
  const [draft, setDraft] = useState('');
  const [message, setMessage] = useState('');
  const [resolution, setResolution] = useState<VoiceSearchResolution | null>(null);
  const [presented, setPresented] = useState(false);

  const sessionRef = useRef(0);
  const navigatedRef = useRef(false);
  const finishingRef = useRef(false);
  const phaseRef = useRef<VoicePhase>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechRef = useRef(speech);
  speechRef.current = speech;
  phaseRef.current = phase;

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    timerRef.current = null;
    levelTimerRef.current = null;
  }, []);

  const reset = useCallback(() => {
    sessionRef.current += 1;
    navigatedRef.current = false;
    finishingRef.current = false;
    clearTimers();
    speechRef.current.cancel();
    setPhase('idle');
    setTranscript('');
    setDraft('');
    setMessage('');
    setResolution(null);
  }, [clearTimers]);

  const go = useCallback(
    (nav: VoiceNavigation | null | undefined) => {
      if (!nav || nav.type === 'none' || navigatedRef.current) return;
      navigatedRef.current = true;
      sessionRef.current += 1;
      clearTimers();
      voiceSheetRef.current?.dismiss();
      setTimeout(() => openNavigation(nav), 40);
    },
    [clearTimers],
  );

  const submitTranscript = useCallback(
    async (text: string, session: number) => {
      const cleaned = text.trim();
      if (session !== sessionRef.current) return;
      if (!cleaned) {
        setPhase('error');
        setMessage(t('voiceCouldNotUnderstand'));
        return;
      }
      setTranscript(cleaned);
      setDraft(cleaned);
      setPhase('searching');
      setMessage('');
      try {
        const result = await resolveVoiceSearch({
          transcript: cleaned,
          language: recognitionLanguage(language),
          latitude: latitude ?? undefined,
          longitude: longitude ?? undefined,
          pincode: pincode ?? undefined,
        });
        if (session !== sessionRef.current) return;
        setResolution(result);
        setTranscript(result.transcript || cleaned);
        if (result.autoNavigate && result.navigation) {
          go(result.navigation);
          return;
        }
        if (result.code === 'no_results') {
          setPhase('no_results');
          setMessage(t('voiceNoMatches'));
          return;
        }
        if (result.code === 'unclear') {
          setPhase('error');
          setMessage(t('voiceCouldNotUnderstand'));
          return;
        }
        if (result.code === 'out_of_stock') {
          setPhase('clarify');
          setMessage(t('voiceNotInStock'));
          return;
        }
        setPhase('clarify');
        setMessage(
          result.code === 'clarify' && result.choices.length === 0
            ? t('voiceSpecifyProduct')
            : t('voiceWhichMaterial'),
        );
      } catch (error) {
        if (session !== sessionRef.current) return;
        setPhase('error');
        setMessage(error instanceof Error ? error.message : t('voiceCouldNotUnderstand'));
      }
    },
    [go, language, latitude, longitude, pincode, t],
  );

  const finishRecording = useCallback(
    async (session: number) => {
      if (session !== sessionRef.current || finishingRef.current) return;
      finishingRef.current = true;
      clearTimers();
      setPhase('transcribing');
      try {
        const utterance = await speechRef.current.stop();
        if (session !== sessionRef.current) {
          speechRef.current.deleteRecording(utterance.audioUri);
          return;
        }
        const text = await transcribeVoiceRecording(utterance, recognitionLanguage(language));
        speechRef.current.deleteRecording(utterance.audioUri);
        await submitTranscript(text, session);
      } catch (error) {
        if (session !== sessionRef.current) return;
        setPhase('error');
        if (error instanceof SpeechCaptureError && error.code === 'cancelled') return;
        setMessage(
          error instanceof SpeechCaptureError || error instanceof Error
            ? error.message
            : t('voiceCouldNotUnderstand'),
        );
      } finally {
        finishingRef.current = false;
      }
    },
    [clearTimers, language, submitTranscript, t],
  );

  const begin = useCallback(async () => {
    const session = ++sessionRef.current;
    navigatedRef.current = false;
    finishingRef.current = false;
    clearTimers();
    setResolution(null);
    setMessage('');
    setTranscript('');
    const lang = recognitionLanguage(language);
    let timedOut = false;

    try {
      if (speechRef.current.mode === 'native') {
        setPhase('listening');
        const text = await Promise.race([
          speechRef.current.beginNative(lang).catch((error: unknown) => {
            if (timedOut) return '';
            throw error;
          }),
          new Promise<string>((_, reject) => {
            timerRef.current = setTimeout(() => {
              timedOut = true;
              void speechRef.current.stop();
              reject(new SpeechCaptureError('no-speech', t('voiceCouldNotUnderstand')));
            }, LISTEN_TIMEOUT_MS);
          }),
        ]);
        clearTimers();
        if (session !== sessionRef.current) return;
        await submitTranscript(text, session);
        return;
      }

      if (speechRef.current.mode === 'unavailable') {
        setPhase('error');
        setMessage(t('voiceCouldNotUnderstand'));
        return;
      }

      await speechRef.current.start(lang);
      if (session !== sessionRef.current) return;
      setPhase('recording');
      levelTimerRef.current = setInterval(() => speechRef.current.readLevel(), 160);
      timerRef.current = setTimeout(() => {
        void finishRecording(session);
      }, RECORD_TIMEOUT_MS);
    } catch (error) {
      if (session !== sessionRef.current) return;
      clearTimers();
      speechRef.current.cancel();
      if (error instanceof SpeechCaptureError && error.code === 'cancelled') return;
      setPhase('error');
      setMessage(
        error instanceof SpeechCaptureError
          ? error.message
          : t('voiceMicNeeded'),
      );
    }
  }, [clearTimers, finishRecording, language, submitTranscript, t]);

  const onMicPress = useCallback(() => {
    const current = phaseRef.current;
    if (current === 'listening') {
      void speechRef.current.stop();
      return;
    }
    if (current === 'recording') {
      void finishRecording(sessionRef.current);
      return;
    }
    if (current === 'transcribing' || current === 'searching') return;
    void begin();
  }, [begin, finishRecording]);

  useEffect(() => {
    if (!presented) return;
    const session = sessionRef.current;
    const kickoff = setTimeout(() => {
      if (session === sessionRef.current && phaseRef.current === 'idle') {
        void begin();
      }
    }, 350);
    return () => clearTimeout(kickoff);
  }, [begin, presented]);

  useEffect(() => {
    if (!presented) return;
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') return;
      if (phaseRef.current === 'listening' || phaseRef.current === 'recording') {
        sessionRef.current += 1;
        clearTimers();
        speechRef.current.cancel();
        setPhase('error');
        setMessage(t('voiceCouldNotUnderstand'));
      }
    });
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      voiceSheetRef.current?.dismiss();
      return true;
    });
    return () => {
      subscription.remove();
      back.remove();
    };
  }, [clearTimers, presented, t]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const status = (() => {
    if (phase === 'listening') return t('listening');
    if (phase === 'recording') return t('voiceRecording');
    if (phase === 'transcribing') return t('voiceUnderstanding');
    if (phase === 'searching') return t('voiceSearchingCatalog');
    if (message) return message;
    return t('tapToSpeak');
  })();

  const showLiveText = phase === 'listening' && (speech.partial || transcript);
  const liveText = speech.partial || transcript;

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
      onDismiss={() => {
        reset();
        setPresented(false);
      }}
      onChange={(index) => setPresented(index >= 0)}>
      <BottomSheetScrollView
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled">
        <Pressable
          onPress={() => voiceSheetRef.current?.dismiss()}
          style={styles.closeButton}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close voice search">
          <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
        </Pressable>

        <Text style={styles.statusText}>{status}</Text>

        {showLiveText ? <Text style={styles.transcript}>&ldquo;{liveText}&rdquo;</Text> : null}
        {!showLiveText && transcript && phase !== 'idle' ? (
          <Text style={styles.transcript}>&ldquo;{transcript}&rdquo;</Text>
        ) : null}

        <Waveform
          active={phase === 'listening' || phase === 'recording'}
          level={speech.level}
        />

        <Pressable
          onPress={onMicPress}
          style={[
            styles.micButton,
            phase === 'listening' || phase === 'recording'
              ? styles.micButtonActive
              : styles.micButtonIdle,
          ]}
          accessibilityRole="button"
          accessibilityLabel={t('tapToSpeak')}>
          <Ionicons
            name={phase === 'listening' || phase === 'recording' ? 'mic' : 'mic-outline'}
            size={28}
            color={phase === 'listening' || phase === 'recording' ? '#1A1A1A' : '#FFFFFF'}
          />
        </Pressable>
        <Text style={styles.micLabel}>
          {phase === 'recording'
            ? t('voiceTapWhenDone')
            : phase === 'listening'
              ? t('listening')
              : t('tapToSpeak')}
        </Text>

        {speech.mode === 'recording' && phase === 'recording' ? (
          <Text style={styles.note}>{t('voiceExpoGoNote')}</Text>
        ) : null}
        {isExpoGo() && speech.mode === 'recording' && phase === 'idle' ? (
          <Text style={styles.note}>{t('voiceExpoGoNote')}</Text>
        ) : null}

        {phase === 'idle' ? (
          <View style={styles.suggestionsWrap}>
            <Text style={styles.suggestionsHeading}>{t('trySaying')}</Text>
            <View style={styles.suggestionRow}>
              {SUGGESTIONS.map((key) => (
                <Pressable
                  key={key}
                  style={styles.suggestionChip}
                  onPress={() => {
                    const session = ++sessionRef.current;
                    void submitTranscript(t(key), session);
                  }}>
                  <Text style={styles.suggestionText}>{t(key)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {phase === 'clarify' && resolution?.choices?.length ? (
          <View style={styles.choiceList}>
            {resolution.choices.map((choice) => (
              <Pressable
                key={`${choice.label}-${choice.navigation.categorySlug ?? choice.label}`}
                style={styles.choiceButton}
                onPress={() => go(choice.navigation)}>
                <Text style={styles.choiceText}>{choice.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {phase === 'error' || phase === 'no_results' || phase === 'clarify' ? (
          <View style={styles.editBlock}>
            <BottomSheetTextInput
              value={draft}
              onChangeText={setDraft}
              placeholder={t('voiceEditHint')}
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={styles.editInput}
              returnKeyType="search"
              onSubmitEditing={() => {
                const session = ++sessionRef.current;
                void submitTranscript(draft, session);
              }}
            />
            <View style={styles.resultActions}>
              <Pressable
                style={styles.resultPrimary}
                onPress={() => {
                  const session = ++sessionRef.current;
                  void submitTranscript(draft, session);
                }}>
                <Text style={styles.resultPrimaryText}>{t('voiceSearchThis')}</Text>
              </Pressable>
              <Pressable style={styles.resultSecondary} onPress={() => void begin()}>
                <Text style={styles.resultSecondaryText}>{t('tryAgain')}</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const sheetBlack = '#0A0A0A';
const accent = theme.primary;
const ink = theme.textOnPrimary;
const white = theme.white;
const whiteSoft = 'rgba(255,255,255,0.72)';
const whiteMuted = 'rgba(255,255,255,0.45)';
const whiteFaint = 'rgba(255,255,255,0.35)';
const whiteChip = 'rgba(255,255,255,0.8)';
const whiteButton = 'rgba(255,255,255,0.75)';
const whiteWash = 'rgba(255,255,255,0.1)';
const whiteLine = 'rgba(255,255,255,0.15)';
const whiteInput = 'rgba(255,255,255,0.16)';
const whiteHandle = 'rgba(255,255,255,0.3)';
const chipFill = 'rgba(255,255,255,0.07)';
const chipLine = 'rgba(255,255,255,0.08)';
const accentFill = 'rgba(254,182,35,0.14)';
const accentLine = 'rgba(254,182,35,0.4)';
const micIdle = '#1E1E1E';

const styles = StyleSheet.create({
  choiceButton: {
    backgroundColor: accentFill,
    borderColor: accentLine,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  choiceList: {
    gap: 8,
    marginTop: 18,
    width: '100%',
  },
  choiceText: {
    color: accent,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  closeButton: {
    alignItems: 'center',
    backgroundColor: whiteWash,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    right: 24,
    top: 4,
    width: 32,
    zIndex: 10,
  },
  editBlock: {
    marginTop: 18,
    width: '100%',
  },
  editInput: {
    borderColor: whiteInput,
    borderRadius: 12,
    borderWidth: 1,
    color: white,
    fontSize: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  handleIndicator: {
    backgroundColor: whiteHandle,
    height: 4,
    width: 40,
  },
  micButton: {
    alignItems: 'center',
    borderRadius: 38,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  micButtonActive: {
    backgroundColor: accent,
  },
  micButtonIdle: {
    backgroundColor: micIdle,
    borderColor: whiteLine,
    borderWidth: 1.5,
  },
  micLabel: {
    color: accent,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  note: {
    color: whiteMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 14,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
  },
  resultPrimary: {
    alignItems: 'center',
    backgroundColor: accent,
    borderRadius: 12,
    flex: 1,
    paddingVertical: 12,
  },
  resultPrimaryText: {
    color: ink,
    fontSize: 14,
    fontWeight: '700',
  },
  resultSecondary: {
    alignItems: 'center',
    borderColor: whiteLine,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultSecondaryText: {
    color: whiteButton,
    fontSize: 14,
  },
  sheetBackground: {
    backgroundColor: sheetBlack,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetContent: {
    alignItems: 'center',
    backgroundColor: sheetBlack,
    flexGrow: 1,
    minHeight: 420,
    paddingBottom: 36,
    paddingHorizontal: 24,
  },
  statusText: {
    color: whiteSoft,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
    marginTop: 28,
    paddingHorizontal: 28,
    textAlign: 'center',
  },
  suggestionChip: {
    backgroundColor: chipFill,
    borderColor: chipLine,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionText: {
    color: whiteChip,
    fontSize: 13,
    fontWeight: '500',
  },
  suggestionsHeading: {
    color: whiteFaint,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  suggestionsWrap: {
    alignItems: 'center',
    marginTop: 28,
  },
  transcript: {
    color: white,
    fontSize: 22,
    fontWeight: '600',
    lineHeight: 30,
    marginBottom: 16,
    paddingHorizontal: 8,
    textAlign: 'center',
  },
  waveBar: {
    backgroundColor: accent,
    borderRadius: 3,
    width: 5,
  },
  waveform: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    height: 56,
    justifyContent: 'center',
    marginBottom: 18,
  },
});
