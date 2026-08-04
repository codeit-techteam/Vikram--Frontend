import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';
const GREEN = '#2E7D32';
const PRESS_SCALE = 0.96;
const ADD_FEEDBACK_MS = 150;

interface QuantityControlsProps {
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  loading?: boolean;
  addLabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  /** Brief press feedback before invoking onAdd (Blinkit-style). */
  addDelayMs?: number;
}

export function QuantityControls({
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  loading = false,
  addLabel = 'ADD',
  disabled = false,
  size = 'md',
  addDelayMs = ADD_FEEDBACK_MS,
}: QuantityControlsProps) {
  const scale = useSharedValue(1);
  const qtyScale = useSharedValue(1);
  const [pendingAdd, setPendingAdd] = useState(false);
  const prevQty = useRef(quantity);
  const isSm = size === 'sm';
  const busy = disabled || loading || pendingAdd;

  useEffect(() => {
    if (prevQty.current === quantity) return;
    prevQty.current = quantity;
    qtyScale.value = withSequence(
      withTiming(1.12, { duration: 90, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 16, stiffness: 280, overshootClamping: true }),
    );
  }, [quantity, qtyScale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const qtyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: qtyScale.value }],
  }));

  const pressIn = () => {
    scale.value = withTiming(PRESS_SCALE, { duration: 80 });
  };

  const pressOut = () => {
    scale.value = withSpring(1, {
      damping: 18,
      stiffness: 320,
      overshootClamping: true,
    });
  };

  const handleAdd = async () => {
    if (busy) return;
    setPendingAdd(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await new Promise((r) => setTimeout(r, addDelayMs));
    try {
      onAdd();
    } finally {
      setPendingAdd(false);
    }
  };

  const handleInc = async () => {
    if (busy) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onIncrement();
  };

  const handleDec = async () => {
    if (busy) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDecrement();
  };

  if (quantity > 0) {
    return (
      <Animated.View
        layout={LinearTransition.duration(200).easing(Easing.out(Easing.cubic))}
        entering={FadeIn.duration(160)}
        style={[styles.stepper, isSm && styles.stepperSm, animStyle]}>
        <Pressable
          onPress={handleDec}
          onPressIn={pressIn}
          onPressOut={pressOut}
          disabled={busy}
          style={[styles.stepBtn, isSm && styles.stepBtnSm]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity">
          <Ionicons name="remove" size={isSm ? 14 : 16} color={DARK} />
        </Pressable>
        <Animated.Text style={[styles.qtyText, isSm && styles.qtyTextSm, qtyAnimStyle]}>
          {quantity}
        </Animated.Text>
        <Pressable
          onPress={handleInc}
          onPressIn={pressIn}
          onPressOut={pressOut}
          disabled={busy}
          style={[styles.stepBtn, isSm && styles.stepBtnSm]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity">
          <Ionicons name="add" size={isSm ? 14 : 16} color={DARK} />
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      layout={LinearTransition.duration(200).easing(Easing.out(Easing.cubic))}
      exiting={FadeOut.duration(120)}
      style={animStyle}>
      <Pressable
        onPress={() => void handleAdd()}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={busy}
        style={[styles.addBtn, isSm && styles.addBtnSm, busy && styles.addBtnDisabled]}
        accessibilityRole="button"
        accessibilityLabel={addLabel}>
        {pendingAdd || loading ? (
          <ActivityIndicator size="small" color={DARK} />
        ) : (
          <Text style={[styles.addBtnText, isSm && styles.addBtnTextSm]}>{addLabel}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    alignSelf: 'flex-end',
    minWidth: 72,
    minHeight: 34,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  addBtnSm: {
    minWidth: 56,
    minHeight: 30,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnDisabled: {
    opacity: 0.55,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN,
    letterSpacing: 0.2,
  },
  addBtnTextSm: {
    fontSize: 11,
  },
  stepper: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 10,
    backgroundColor: GOLD,
    overflow: 'hidden',
    minHeight: 34,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  stepperSm: {
    borderRadius: 8,
    minHeight: 30,
  },
  stepBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnSm: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  qtyText: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
  },
  qtyTextSm: {
    minWidth: 22,
    fontSize: 12,
  },
});
