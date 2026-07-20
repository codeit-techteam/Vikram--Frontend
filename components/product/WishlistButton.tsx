import { useCallback, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';

interface WishlistButtonProps {
  productId: string;
  initialActive?: boolean;
  onToggle?: (active: boolean) => void;
  size?: number;
}

export function WishlistButton({
  productId,
  initialActive = false,
  onToggle,
  size = 18,
}: WishlistButtonProps) {
  const [active, setActive] = useState(initialActive);
  const burst = useSharedValue(1);

  const burstStyle = useAnimatedStyle(() => ({
    transform: [{ scale: burst.value }],
  }));

  const handlePress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    burst.value = withSequence(
      withSpring(1.2, { damping: 8 }),
      withSpring(1, { damping: 12 }),
    );
    setActive((prev) => {
      const next = !prev;
      onToggle?.(next);
      return next;
    });
  }, [burst, onToggle, productId]);

  return (
    <Animated.View style={[styles.wrap, burstStyle]}>
      <ScaledPressable
        onPress={() => void handlePress()}
        style={styles.btn}
        scaleTo={0.9}
        accessibilityRole="button"
        accessibilityLabel={active ? 'Remove from wishlist' : 'Add to wishlist'}
        accessibilityState={{ selected: active }}>
        <Ionicons
          name={active ? 'heart' : 'heart-outline'}
          size={size}
          color={active ? '#E53935' : '#666'}
        />
      </ScaledPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
});
