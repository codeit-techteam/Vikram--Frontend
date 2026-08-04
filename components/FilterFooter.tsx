import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import {
  FILTER_COLORS,
  FILTER_LAYOUT,
  FILTER_RADIUS,
  FILTER_SPACING,
  FILTER_SPRING,
} from '@constants/filterTokens';

interface FilterFooterProps {
  resultCount: number;
  onReset: () => void;
  onApply: () => void;
  applyLabel?: string;
  resetLabel?: string;
  showCount?: boolean;
  /** When false, sheet-level bottomInset handles safe area */
  safeAreaBottom?: boolean;
}

function AnimatedResultCount({ count }: { count: number }) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0, { duration: 80 }),
      withTiming(1, { duration: 100 }),
    );
    translateY.value = withSequence(
      withTiming(-6, { duration: 80 }),
      withTiming(0, { duration: 100 }),
    );
  }, [count, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text
      style={[{ fontWeight: '700', color: '#FFFFFF', fontSize: 15 }, animStyle]}>
      {count}
    </Animated.Text>
  );
}

export function FilterFooter({
  resultCount,
  onReset,
  onApply,
  applyLabel = 'Apply',
  resetLabel = 'Clear All',
  showCount = true,
  safeAreaBottom = true,
}: FilterFooterProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = safeAreaBottom
    ? Math.max(insets.bottom, FILTER_SPACING.lg)
    : FILTER_SPACING.md;
  const applyScale = useSharedValue(1);

  const applyAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: applyScale.value }],
  }));

  const handleApply = () => {
    applyScale.value = withSequence(
      withSpring(0.96, FILTER_SPRING.press),
      withSpring(1, FILTER_SPRING.press),
    );
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onApply();
  };

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
        onPress={() => {
          void Haptics.selectionAsync();
          onReset();
        }}
        scaleTo={0.97}
        style={{
          width: '32%',
          maxWidth: 120,
          height: FILTER_LAYOUT.footerHeight,
          borderRadius: FILTER_RADIUS.card,
          borderWidth: 1.5,
          borderColor: FILTER_COLORS.primary,
          backgroundColor: FILTER_COLORS.surface,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 8,
        }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 14, fontWeight: '700', color: FILTER_COLORS.primary }}>
          {resetLabel}
        </Text>
      </ScaledPressable>

      <Animated.View style={[{ flex: 1, minWidth: 0 }, applyAnimStyle]}>
        <ScaledPressable
          onPress={handleApply}
          scaleTo={0.98}
          style={{
            height: FILTER_LAYOUT.footerHeight,
            borderRadius: FILTER_RADIUS.card,
            backgroundColor: FILTER_COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
            paddingHorizontal: 12,
          }}>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 15,
              fontWeight: '700',
              color: '#FFFFFF',
              flexShrink: 1,
            }}>
            {applyLabel}
            {showCount ? ' (' : ''}
          </Text>
          {showCount ? (
            <>
              <AnimatedResultCount count={resultCount} />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: '#FFFFFF',
                  flexShrink: 1,
                }}>
                {` ${resultCount === 1 ? 'Product' : 'Products'})`}
              </Text>
            </>
          ) : null}
        </ScaledPressable>
      </Animated.View>
    </View>
  );
}
