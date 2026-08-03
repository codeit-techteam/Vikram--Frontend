import { useCallback, useEffect, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { FILTER_COLORS } from '@constants/filterTokens';

const THUMB_SIZE = 24;
const TRACK_HEIGHT = 4;
const HIT_SLOP = 12;

interface DualRangeSliderProps {
  minBound: number;
  maxBound: number;
  low: number;
  high: number;
  step?: number;
  onChange: (low: number, high: number) => void;
  onSlidingComplete?: (low: number, high: number) => void;
}

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

function snap(value: number, step: number) {
  'worklet';
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

export function DualRangeSlider({
  minBound,
  maxBound,
  low,
  high,
  step = 50,
  onChange,
  onSlidingComplete,
}: DualRangeSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const usable = Math.max(trackWidth - THUMB_SIZE, 1);
  const range = Math.max(maxBound - minBound, 1);

  const lowX = useSharedValue(0);
  const highX = useSharedValue(usable);
  const startLowX = useSharedValue(0);
  const startHighX = useSharedValue(0);
  const dragging = useSharedValue(0);

  useEffect(() => {
    if (trackWidth <= 0 || dragging.value === 1) return;
    lowX.value = ((low - minBound) / range) * usable;
    highX.value = ((high - minBound) / range) * usable;
  }, [low, high, minBound, range, usable, trackWidth, lowX, highX, dragging]);

  const emitChange = useCallback(
    (nextLowX: number, nextHighX: number, complete: boolean) => {
      let nextLow = snap(minBound + (nextLowX / usable) * range, step);
      let nextHigh = snap(minBound + (nextHighX / usable) * range, step);
      nextLow = Math.max(minBound, Math.min(nextLow, nextHigh - step, maxBound));
      nextHigh = Math.min(maxBound, Math.max(nextHigh, nextLow + step, minBound));
      onChange(nextLow, nextHigh);
      if (complete) onSlidingComplete?.(nextLow, nextHigh);
    },
    [minBound, maxBound, range, usable, step, onChange, onSlidingComplete],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const lowGesture = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      dragging.value = 1;
      startLowX.value = lowX.value;
    })
    .onUpdate((e) => {
      const next = clamp(startLowX.value + e.translationX, 0, highX.value - 8);
      lowX.value = next;
      runOnJS(emitChange)(next, highX.value, false);
    })
    .onFinalize(() => {
      dragging.value = 0;
      runOnJS(emitChange)(lowX.value, highX.value, true);
    });

  const highGesture = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      dragging.value = 1;
      startHighX.value = highX.value;
    })
    .onUpdate((e) => {
      const next = clamp(startHighX.value + e.translationX, lowX.value + 8, usable);
      highX.value = next;
      runOnJS(emitChange)(lowX.value, next, false);
    })
    .onFinalize(() => {
      dragging.value = 0;
      runOnJS(emitChange)(lowX.value, highX.value, true);
    });

  const lowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: lowX.value }],
  }));

  const highStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    left: lowX.value + THUMB_SIZE / 2,
    width: Math.max(highX.value - lowX.value, 0),
  }));

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <View style={styles.track} />
      <Animated.View style={[styles.fill, fillStyle]} />
      <GestureDetector gesture={lowGesture}>
        <Animated.View style={[styles.thumbHit, lowStyle]}>
          <View style={styles.thumb} />
        </Animated.View>
      </GestureDetector>
      <GestureDetector gesture={highGesture}>
        <Animated.View style={[styles.thumbHit, highStyle]}>
          <View style={styles.thumb} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: THUMB_SIZE + HIT_SLOP * 2,
    justifyContent: 'center',
    marginVertical: 4,
  },
  track: {
    position: 'absolute',
    left: THUMB_SIZE / 2,
    right: THUMB_SIZE / 2,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: FILTER_COLORS.border,
  },
  fill: {
    position: 'absolute',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: FILTER_COLORS.primary,
  },
  thumbHit: {
    position: 'absolute',
    width: THUMB_SIZE + HIT_SLOP * 2,
    height: THUMB_SIZE + HIT_SLOP * 2,
    marginLeft: -HIT_SLOP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: FILTER_COLORS.primary,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
