import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';
const GREEN = '#2E7D32';

interface QuantityControlsProps {
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  loading?: boolean;
  addLabel?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
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
}: QuantityControlsProps) {
  const scale = useSharedValue(1);
  const isSm = size === 'sm';

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pulse = () => {
    scale.value = withSequence(
      withSpring(0.92, { damping: 15 }),
      withSpring(1, { damping: 12 }),
    );
  };

  const handleAdd = async () => {
    if (disabled || loading) return;
    pulse();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAdd();
  };

  const handleInc = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onIncrement();
  };

  const handleDec = async () => {
    if (disabled || loading) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDecrement();
  };

  if (quantity > 0) {
    return (
      <Animated.View style={[styles.stepper, isSm && styles.stepperSm, animStyle]}>
        <TouchableOpacity
          onPress={handleDec}
          disabled={disabled || loading}
          activeOpacity={0.7}
          style={[styles.stepBtn, isSm && styles.stepBtnSm]}
          hitSlop={6}>
          <Ionicons name="remove" size={isSm ? 14 : 16} color={DARK} />
        </TouchableOpacity>
        <Text style={[styles.qtyText, isSm && styles.qtyTextSm]}>{quantity}</Text>
        <TouchableOpacity
          onPress={handleInc}
          disabled={disabled || loading}
          activeOpacity={0.7}
          style={[styles.stepBtn, isSm && styles.stepBtnSm]}
          hitSlop={6}>
          <Ionicons name="add" size={isSm ? 14 : 16} color={DARK} />
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        onPress={handleAdd}
        disabled={disabled || loading}
        activeOpacity={0.85}
        style={[styles.addBtn, isSm && styles.addBtnSm, disabled && styles.addBtnDisabled]}>
        {loading ? (
          <ActivityIndicator size="small" color={DARK} />
        ) : (
          <Text style={[styles.addBtnText, isSm && styles.addBtnTextSm]}>{addLabel}</Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    alignSelf: 'flex-end',
    minWidth: 72,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: GOLD,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  addBtnSm: {
    minWidth: 52,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: GREEN,
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
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  stepperSm: {
    borderRadius: 6,
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
