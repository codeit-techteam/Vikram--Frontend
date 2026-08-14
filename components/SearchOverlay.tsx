import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { SearchExperience } from '@components/search/SearchExperience';
import type { UseSearchReturn } from '@hooks/useSearch';

interface SearchOverlayProps extends UseSearchReturn {
  onClose: () => void;
}

export function SearchOverlay({ onClose, ...search }: SearchOverlayProps) {
  const slideY = useSharedValue(24);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    slideY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.ease) });
    backdropOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
  }, [backdropOpacity, slideY]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * 0.28,
  }));

  return (
    <View style={styles.root} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <Animated.View style={[styles.panel, panelStyle]}>
        <SearchExperience {...search} onClose={onClose} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  panel: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
});
