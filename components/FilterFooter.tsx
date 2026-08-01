import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScaledPressable } from '@components/ScaledPressable';
import { FILTER_COLORS, FILTER_RADIUS, FILTER_SPACING } from '@constants/filterTokens';

interface FilterFooterProps {
  resultCount: number;
  onReset: () => void;
  onApply: () => void;
  applyLabel?: string;
  showCount?: boolean;
  /** When false, sheet-level bottomInset handles safe area */
  safeAreaBottom?: boolean;
}

function AnimatedResultCount({ count }: { count: number }) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: 100 }),
      withTiming(1, { duration: 100 }),
    );
    translateY.value = withSequence(
      withTiming(-8, { duration: 100 }),
      withTiming(0, { duration: 100 }),
    );
  }, [count, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[{ fontWeight: '700', color: '#FFFFFF', fontSize: 15 }, animStyle]}>
      {count}
    </Animated.Text>
  );
}

export function FilterFooter({
  resultCount,
  onReset,
  onApply,
  applyLabel = 'Show Results',
  showCount = true,
  safeAreaBottom = true,
}: FilterFooterProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = safeAreaBottom
    ? Math.max(insets.bottom, FILTER_SPACING.lg)
    : FILTER_SPACING.lg;

  return (
    <View
      style={{
        borderTopWidth: 1,
        borderTopColor: FILTER_COLORS.divider,
        paddingHorizontal: FILTER_SPACING.lg,
        paddingTop: FILTER_SPACING.md,
        paddingBottom: bottomPad,
        flexDirection: 'row',
        gap: FILTER_SPACING.sm,
        backgroundColor: FILTER_COLORS.surface,
      }}>
      <ScaledPressable
        onPress={onReset}
        scaleTo={0.97}
        style={{
          width: '30%',
          height: 52,
          borderRadius: FILTER_RADIUS.card,
          borderWidth: 1.5,
          borderColor: FILTER_COLORS.primary,
          backgroundColor: FILTER_COLORS.surface,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: FILTER_COLORS.primary }}>
          Reset
        </Text>
      </ScaledPressable>

      <ScaledPressable
        onPress={onApply}
        scaleTo={0.97}
        style={{
          flex: 1,
          height: 52,
          borderRadius: FILTER_RADIUS.card,
          backgroundColor: FILTER_COLORS.primary,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
        }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
          {applyLabel}
          {showCount ? ' (' : ''}
        </Text>
        {showCount ? (
          <>
            <AnimatedResultCount count={resultCount} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>)</Text>
          </>
        ) : null}
      </ScaledPressable>
    </View>
  );
}
