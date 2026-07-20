import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { useTranslation } from '@store/languageStore';

const GOLD = '#FEB623';
const DARK = '#1A1A1A';
const GREEN = '#34C759';

export type AddToCartMode = 'add' | 'added' | 'update';

interface AddToCartButtonProps {
  mode: AddToCartMode;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
  labelOverride?: string;
}

export function AddToCartButton({
  mode,
  onPress,
  loading = false,
  disabled = false,
  fullWidth = true,
  compact = false,
  labelOverride,
}: AddToCartButtonProps) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isAdded = mode === 'added';
  const isUpdate = mode === 'update';
  const isDisabled = disabled || loading || isAdded;

  const label =
    labelOverride ??
    (loading
      ? '...'
      : isAdded
        ? t('addedToCartBtn')
        : isUpdate
          ? t('updateCart')
          : t('addToCart'));

  const handlePress = async () => {
    if (isDisabled) return;
    scale.value = withSequence(
      withSpring(0.96, { damping: 15 }),
      withSpring(1, { damping: 12 }),
    );
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View
      style={[fullWidth && !compact && styles.fullWidth, compact && styles.compactWrap, animStyle]}>
      <TouchableOpacity
        onPress={() => void handlePress()}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[
          styles.btn,
          compact && styles.btnCompact,
          isAdded && styles.btnAdded,
          isUpdate && styles.btnUpdate,
          (disabled || loading) && !isAdded && styles.btnDisabled,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled }}>
        {loading ? (
          <ActivityIndicator size="small" color={DARK} />
        ) : (
          <Text
            style={[
              styles.label,
              compact && styles.labelCompact,
              isAdded && styles.labelAdded,
            ]}
            numberOfLines={1}>
            {label}
          </Text>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

/** Derive button mode from local qty vs cart qty. */
export function getAddToCartMode(localQty: number, cartQty: number): AddToCartMode {
  if (cartQty <= 0) return 'add';
  if (localQty === cartQty) return 'added';
  return 'update';
}

const styles = StyleSheet.create({
  fullWidth: {
    width: '100%',
  },
  compactWrap: {
    flex: 1,
  },
  btn: {
    backgroundColor: GOLD,
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btnCompact: {
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    minHeight: 32,
    flex: 1,
    alignSelf: 'auto',
  },
  btnAdded: {
    backgroundColor: GREEN,
  },
  btnUpdate: {
    backgroundColor: GOLD,
  },
  btnDisabled: {
    opacity: 0.55,
  },
  label: {
    fontSize: 15,
    fontWeight: '800',
    color: DARK,
  },
  labelCompact: {
    fontSize: 11,
  },
  labelAdded: {
    color: '#FFFFFF',
  },
});
