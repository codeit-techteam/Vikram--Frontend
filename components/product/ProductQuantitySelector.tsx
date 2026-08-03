import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';

interface ProductQuantitySelectorProps {
  quantity: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Pill-shaped stepper with larger touch targets. */
  variant?: 'default' | 'capsule';
  fullWidth?: boolean;
}

/** Local quantity stepper — does NOT touch the cart. */
export function ProductQuantitySelector({
  quantity,
  onChange,
  min = 1,
  max,
  step = 1,
  disabled = false,
  size = 'md',
  variant = 'default',
  fullWidth = false,
}: ProductQuantitySelectorProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const isCapsule = variant === 'capsule';

  const bump = async (delta: number) => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let next = quantity + delta * step;
    next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    onChange(next);
  };

  return (
    <View
      style={[
        styles.stepper,
        isSm && styles.stepperSm,
        isLg && styles.stepperLg,
        isCapsule && styles.stepperCapsule,
        fullWidth && styles.stepperFullWidth,
        disabled && styles.disabled,
      ]}>
      <TouchableOpacity
        onPress={() => void bump(-1)}
        disabled={disabled || quantity <= min}
        activeOpacity={0.7}
        style={[
          styles.btn,
          isSm && styles.btnSm,
          isLg && styles.btnLg,
          isCapsule && styles.btnCapsule,
        ]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Decrease quantity">
        <Ionicons
          name="remove"
          size={isCapsule ? 18 : isSm ? 14 : isLg ? 20 : 16}
          color={DARK}
        />
      </TouchableOpacity>
      <Text
        style={[
          styles.qty,
          isSm && styles.qtySm,
          isLg && styles.qtyLg,
          isCapsule && styles.qtyCapsule,
          fullWidth && styles.qtyFullWidth,
        ]}>
        {quantity}
      </Text>
      <TouchableOpacity
        onPress={() => void bump(1)}
        disabled={disabled || (max !== undefined && quantity >= max)}
        activeOpacity={0.7}
        style={[
          styles.btn,
          isSm && styles.btnSm,
          isLg && styles.btnLg,
          isCapsule && styles.btnCapsule,
        ]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Increase quantity">
        <Ionicons
          name="add"
          size={isCapsule ? 18 : isSm ? 14 : isLg ? 20 : 16}
          color={DARK}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: GOLD,
    borderRadius: 8,
    backgroundColor: '#FFF8E8',
    overflow: 'hidden',
  },
  stepperSm: {
    borderRadius: 6,
  },
  stepperLg: {
    borderRadius: 12,
  },
  stepperCapsule: {
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 4,
    minHeight: 44,
    height: 44,
  },
  stepperFullWidth: {
    alignSelf: 'stretch',
    justifyContent: 'space-between',
  },
  disabled: {
    opacity: 0.5,
  },
  btn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSm: {
    paddingHorizontal: 7,
    paddingVertical: 5,
  },
  btnLg: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  btnCapsule: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: {
    minWidth: 28,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
  },
  qtySm: {
    minWidth: 20,
    fontSize: 12,
  },
  qtyLg: {
    minWidth: 40,
    fontSize: 18,
  },
  qtyCapsule: {
    minWidth: 36,
    fontSize: 16,
    fontWeight: '800',
  },
  qtyFullWidth: {
    flex: 1,
    textAlign: 'center',
  },
});
