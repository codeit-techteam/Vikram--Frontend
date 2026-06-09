import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { useTranslation } from '@store/languageStore';

interface VoiceSearchUIProps {
  onCancel: () => void;
  error?: string | null;
}

function WaveBar({ delay }: { delay: number }) {
  const scaleY = useSharedValue(0.4);

  useEffect(() => {
    scaleY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 350 + delay, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.35, { duration: 350 + delay, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [delay, scaleY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: scaleY.value }],
  }));

  return <Animated.View style={[styles.bar, animStyle]} />;
}

export function VoiceSearchUI({ onCancel, error }: VoiceSearchUIProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.micCircle}>
        <Ionicons name="mic" size={32} color="#FEB623" />
      </View>

      <View style={styles.waveRow}>
        <WaveBar delay={0} />
        <WaveBar delay={80} />
        <WaveBar delay={160} />
        <WaveBar delay={80} />
        <WaveBar delay={0} />
      </View>

      <Text style={styles.status}>{error ?? t('listening')}</Text>

      <Pressable style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelText}>{t('cancel')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 48,
  },
  micCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF4D1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    marginBottom: 20,
  },
  bar: {
    width: 4,
    height: 32,
    borderRadius: 2,
    backgroundColor: '#FEB623',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  cancelBtn: {
    marginTop: 32,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
});
