import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface SkeletonRowsProps {
  count?: number;
}

function SkeletonRow({ delay }: { delay: number }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 }),
      ),
      -1,
      false,
    );
  }, [opacity, delay]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.row, animStyle]}>
      <View style={styles.icon} />
      <View style={styles.content}>
        <View style={styles.linePrimary} />
        <View style={styles.lineSecondary} />
      </View>
    </Animated.View>
  );
}

export function SkeletonRows({ count = 4 }: SkeletonRowsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRow key={index} delay={index * 80} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  icon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E8E8E8',
  },
  content: {
    flex: 1,
    gap: 8,
  },
  linePrimary: {
    height: 14,
    width: '70%',
    borderRadius: 4,
    backgroundColor: '#E8E8E8',
  },
  lineSecondary: {
    height: 10,
    width: '40%',
    borderRadius: 4,
    backgroundColor: '#F0F0F0',
  },
});
