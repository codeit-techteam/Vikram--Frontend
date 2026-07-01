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
}

export function VariantChip({ label, selected, onPress, compact = false }: VariantChipProps) {
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
        className={`rounded-full border-[1.5px] ${
          compact ? 'px-3 py-1.5' : 'px-4 py-2.5'
        } ${selected ? 'border-primary bg-primary' : 'border-border bg-background'}`}>
        <Text
          className={`font-semibold ${
            compact ? 'text-xs' : 'text-sm'
          } ${selected ? 'text-onPrimary' : 'text-text-secondary'}`}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
