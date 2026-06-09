import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

export function PulseDot({ size = 24, color = '#FEB623' }: { size?: number; color?: string }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.4, { duration: 750 }), withTiming(1, { duration: 750 })),
      -1,
    );
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        style,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        },
      ]}>
      <View
        style={{
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: size,
          backgroundColor: '#FFFFFF',
        }}
      />
    </Animated.View>
  );
}
