import { memo, useEffect, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const SHIMMER_BG = '#F2F2F2';
const SHIMMER_HIGHLIGHT = '#FAFAFA';
const SHIMMER_DURATION = 1200;
const BAND_WIDTH = 96;

interface ShimmerPlaceholderProps {
  style?: StyleProp<ViewStyle>;
}

function ShimmerPlaceholderComponent({ style }: ShimmerPlaceholderProps) {
  const [layoutWidth, setLayoutWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: SHIMMER_DURATION, easing: Easing.linear }),
      -1,
      false,
    );
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: progress.value * (layoutWidth + BAND_WIDTH) - BAND_WIDTH,
      },
    ],
  }));

  return (
    <View
      style={[styles.base, style]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 0 && w !== layoutWidth) setLayoutWidth(w);
      }}>
      {layoutWidth > 0 ? (
        <Animated.View style={[styles.band, animStyle]}>
          <LinearGradient
            colors={[SHIMMER_BG, SHIMMER_HIGHLIGHT, SHIMMER_BG]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.gradient}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: SHIMMER_BG,
    overflow: 'hidden',
  },
  band: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    width: BAND_WIDTH,
    height: '100%',
  },
});

export const ShimmerPlaceholder = memo(ShimmerPlaceholderComponent);
