import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  duration?: number;
}

export function AnimatedProgressBar({
  progress,
  height = 6,
  color = '#FEB623',
  trackColor = '#E0E0E0',
  duration = 800,
}: AnimatedProgressBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 1), { duration });
  }, [progress, duration, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%`,
  }));

  return (
    <View className="w-full overflow-hidden rounded-full" style={{ height, backgroundColor: trackColor }}>
      <Animated.View className="h-full rounded-full" style={[{ backgroundColor: color }, fillStyle]} />
    </View>
  );
}
