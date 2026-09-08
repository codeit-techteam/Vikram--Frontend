import { useEffect } from 'react';
import { Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface VariantChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
  price?: string;
  unavailable?: boolean;
}

export function VariantChip({
  label,
  selected,
  onPress,
  compact = false,
  price,
  unavailable = false,
}: VariantChipProps) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.06 : 1, { damping: 14, stiffness: 220 });
  }, [selected, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePress}
        className={`items-center rounded-2xl border-[1.5px] ${
          compact ? 'px-3 py-1.5' : 'px-4 py-2.5'
        } ${
          selected
            ? 'border-primary bg-primary'
            : unavailable
              ? 'border-border bg-background opacity-50'
              : 'border-border bg-background'
        }`}>
        <Text
          className={`font-semibold ${
            compact ? 'text-xs' : 'text-sm'
          } ${selected ? 'text-onPrimary' : 'text-text-secondary'}`}>
          {unavailable ? `${label} · Out of stock` : label}
        </Text>
        {price ? (
          <Text
            className={`mt-0.5 font-bold ${
              compact ? 'text-[10px]' : 'text-xs'
            } ${selected ? 'text-onPrimary' : 'text-text'}`}>
            {price}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}
