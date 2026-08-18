import { useEffect, useId, useRef, useState } from 'react';
import {
  InputAccessoryView,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const GOLD = '#FEB623';
const GOLD_SOFT = '#FFF8E8';
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
  onEditingChange?: (editing: boolean) => void;
}

function digitsOnly(text: string) {
  return text.replace(/[^\d]/g, '');
}

function clampQty(value: number, min: number, max?: number) {
  let next = Math.floor(value);
  if (!Number.isFinite(next)) next = min;
  next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

/** Local quantity stepper — does NOT touch the cart. Tap the number to type. */
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
  onEditingChange,
}: ProductQuantitySelectorProps) {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const isCapsule = variant === 'capsule';
  const inputRef = useRef<TextInput>(null);
  const accessoryId = `qty-acc-${useId().replace(/:/g, '')}`;
  const maxLen = String(max ?? 9999).length;

  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(String(quantity));

  const focusProgress = useSharedValue(0);
  const qtyScale = useSharedValue(1);
  const skipBounce = useRef(false);
  const didMountQty = useRef(false);

  useEffect(() => {
    if (!focused) setDraft(String(quantity));
  }, [quantity, focused]);

  useEffect(() => {
    if (!didMountQty.current) {
      didMountQty.current = true;
      return;
    }
    if (skipBounce.current) {
      skipBounce.current = false;
      return;
    }
    qtyScale.value = withSequence(
      withTiming(1.08, { duration: 80, easing: Easing.out(Easing.cubic) }),
      withSpring(1, { damping: 16, stiffness: 280, overshootClamping: true }),
    );
  }, [quantity, qtyScale]);

  const emit = (next: number, fromTyping = false) => {
    const clamped = clampQty(next, min, max);
    if (clamped === quantity) return clamped;
    if (fromTyping) skipBounce.current = true;
    onChange(clamped);
    return clamped;
  };

  const commitDraft = () => {
    const parsed = parseInt(draft, 10);
    const next = emit(Number.isFinite(parsed) ? parsed : min);
    setDraft(String(next));
    return next;
  };

  const bump = async (delta: number) => {
    if (disabled) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const base = focused ? clampQty(parseInt(draft, 10) || quantity, min, max) : quantity;
    const next = emit(base + delta * step);
    if (focused) setDraft(String(next));
  };

  const handleFocus = () => {
    if (disabled) return;
    setFocused(true);
    setDraft(String(quantity));
    focusProgress.value = withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) });
    onEditingChange?.(true);
    void Haptics.selectionAsync();
  };

  const handleBlur = () => {
    commitDraft();
    setFocused(false);
    focusProgress.value = withTiming(0, { duration: 160, easing: Easing.inOut(Easing.cubic) });
    onEditingChange?.(false);
  };

  const handleChangeText = (text: string) => {
    const cleaned = digitsOnly(text).slice(0, maxLen);
    setDraft(cleaned);
    if (cleaned === '') return;
    const parsed = parseInt(cleaned, 10);
    if (!Number.isFinite(parsed)) return;
    if (max !== undefined && parsed > max) {
      setDraft(String(max));
      emit(max, true);
      return;
    }
    if (parsed >= min) emit(parsed, true);
  };

  const applyMax = () => {
    if (max === undefined) return;
    const next = emit(max, true);
    setDraft(String(next));
    inputRef.current?.blur();
  };

  const stepperAnimStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(focusProgress.value, [0, 1], [GOLD, '#E8A40C']),
    backgroundColor: interpolateColor(focusProgress.value, [0, 1], [GOLD_SOFT, '#FFF3D1']),
    transform: [{ scale: 1 + focusProgress.value * 0.015 }],
  }));

  const fieldAnimStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(focusProgress.value, [0, 1], ['transparent', '#FFFFFF']),
    transform: [{ scale: qtyScale.value }],
  }));

  const iconSize = isCapsule ? 18 : isSm ? 14 : isLg ? 20 : 16;
  const canDec = !disabled && (focused ? (parseInt(draft, 10) || 0) > min : quantity > min);
  const canInc = !disabled && (max === undefined || quantity < max);

  return (
    <>
      <Animated.View
        style={[
          styles.stepper,
          isSm && styles.stepperSm,
          isLg && styles.stepperLg,
          isCapsule && styles.stepperCapsule,
          fullWidth && styles.stepperFullWidth,
          disabled && styles.disabled,
          stepperAnimStyle,
        ]}>
        <Pressable
          onPress={() => void bump(-1)}
          disabled={!canDec}
          hitSlop={6}
          style={({ pressed }) => [
            styles.btn,
            isSm && styles.btnSm,
            isLg && styles.btnLg,
            isCapsule && styles.btnCapsule,
            pressed && styles.btnPressed,
            !canDec && styles.btnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity">
          <Ionicons name="remove" size={iconSize} color={DARK} />
        </Pressable>

        <Animated.View
          style={[
            styles.fieldWrap,
            isSm && styles.fieldWrapSm,
            isLg && styles.fieldWrapLg,
            isCapsule && styles.fieldWrapCapsule,
            fullWidth && styles.fieldWrapFull,
            fieldAnimStyle,
          ]}>
          <TextInput
            ref={inputRef}
            value={focused ? draft : String(quantity)}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleBlur}
            keyboardType="number-pad"
            inputMode="numeric"
            returnKeyType="done"
            selectTextOnFocus
            caretHidden={!focused}
            maxLength={maxLen}
            editable={!disabled}
            blurOnSubmit
            underlineColorAndroid="transparent"
            selectionColor={GOLD}
            placeholder={String(min)}
            placeholderTextColor="#B0B0B0"
            inputAccessoryViewID={Platform.OS === 'ios' ? accessoryId : undefined}
            style={[
              styles.qtyInput,
              isSm && styles.qtyInputSm,
              isLg && styles.qtyInputLg,
              isCapsule && styles.qtyInputCapsule,
            ]}
            textAlignVertical="center"
            accessibilityLabel={`Quantity ${quantity}`}
            accessibilityHint="Tap to type a quantity"
          />
        </Animated.View>

        <Pressable
          onPress={() => void bump(1)}
          disabled={!canInc}
          hitSlop={6}
          style={({ pressed }) => [
            styles.btn,
            isSm && styles.btnSm,
            isLg && styles.btnLg,
            isCapsule && styles.btnCapsule,
            pressed && styles.btnPressed,
            !canInc && styles.btnDisabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity">
          <Ionicons name="add" size={iconSize} color={DARK} />
        </Pressable>
      </Animated.View>

      {Platform.OS === 'ios' ? (
        <InputAccessoryView nativeID={accessoryId}>
          <View style={styles.accessory}>
            {max !== undefined ? (
              <Pressable onPress={applyMax} hitSlop={8} accessibilityRole="button">
                <Text style={styles.accessoryMax}>Set max ({max})</Text>
              </Pressable>
            ) : (
              <Text style={styles.accessoryHint}>Enter quantity</Text>
            )}
            <Pressable
              onPress={() => {
                commitDraft();
                Keyboard.dismiss();
              }}
              hitSlop={8}
              style={styles.accessoryDone}
              accessibilityRole="button"
              accessibilityLabel="Done">
              <Text style={styles.accessoryDoneText}>Done</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      ) : null}
    </>
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
    backgroundColor: GOLD_SOFT,
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
  btnPressed: {
    opacity: 0.55,
  },
  btnDisabled: {
    opacity: 0.28,
  },
  fieldWrap: {
    minWidth: 36,
    minHeight: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fieldWrapSm: {
    minWidth: 24,
    minHeight: 22,
    borderRadius: 6,
  },
  fieldWrapLg: {
    minWidth: 48,
    minHeight: 32,
    borderRadius: 10,
  },
  fieldWrapCapsule: {
    minWidth: 52,
    alignSelf: 'stretch',
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 4,
  },
  fieldWrapFull: {
    flex: 1,
  },
  qtyInput: {
    minWidth: 28,
    paddingVertical: 0,
    paddingHorizontal: 2,
    margin: 0,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
    includeFontPadding: false,
  },
  qtyInputSm: {
    minWidth: 20,
    fontSize: 12,
  },
  qtyInputLg: {
    minWidth: 40,
    fontSize: 18,
  },
  qtyInputCapsule: {
    minWidth: 44,
    fontSize: 16,
    fontWeight: '800',
  },
  accessory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF8E8',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E8D7A8',
  },
  accessoryHint: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  accessoryMax: {
    fontSize: 13,
    fontWeight: '700',
    color: DARK,
  },
  accessoryDone: {
    backgroundColor: GOLD,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  accessoryDoneText: {
    fontSize: 14,
    fontWeight: '800',
    color: DARK,
  },
});
