import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { DualRangeSlider } from '@components/filter-sections/DualRangeSlider';
import { ScaledPressable } from '@components/ScaledPressable';
import { FILTER_COLORS, FILTER_RADIUS, FILTER_SPACING } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

function formatPrice(value: number) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function parsePriceInput(text: string): number | null {
  const cleaned = text.replace(/[^\d]/g, '');
  if (!cleaned) return null;
  return Number(cleaned);
}

function MatchingCount({ count }: { count: number }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(0.35, { duration: 80 }),
      withTiming(1, { duration: 120 }),
    );
  }, [count, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text
      style={[
        {
          fontSize: 15,
          fontWeight: '700',
          color: FILTER_COLORS.text,
        },
        style,
      ]}>
      {count} {count === 1 ? 'Product' : 'Products'}
    </Animated.Text>
  );
}

/**
 * Compact price filter: quick radios + min/max inputs + dual-thumb slider.
 * Designed to fit on one screen without scrolling.
 */
export function PriceRangeSection({
  draft,
  onChange,
  config,
  facetCounts,
  matchingCount,
}: FilterSectionProps) {
  const [minBound, maxBound] = config.priceBounds;
  const [minVal, maxVal] = draft.priceRange;
  const safeMin = Math.min(minVal, maxVal);
  const safeMax = Math.max(minVal, maxVal);

  const [minText, setMinText] = useState(String(Math.round(safeMin)));
  const [maxText, setMaxText] = useState(String(Math.round(safeMax)));

  useEffect(() => {
    setMinText(String(Math.round(safeMin)));
    setMaxText(String(Math.round(safeMax)));
  }, [safeMin, safeMax]);

  const applyCustomRange = useCallback(
    (nextMin: number, nextMax: number) => {
      const lo = Math.max(minBound, Math.min(nextMin, nextMax - 50));
      const hi = Math.min(maxBound, Math.max(nextMax, nextMin + 50));
      onChange({
        ...draft,
        pricePresets: [],
        priceRange: [lo, hi],
      });
    },
    [draft, onChange, minBound, maxBound],
  );

  const selectPreset = (presetId: string) => {
    void Haptics.selectionAsync();
    const exists = draft.pricePresets.includes(presetId) && draft.pricePresets.length === 1;
    if (exists) {
      onChange({
        ...draft,
        pricePresets: [],
        priceRange: [...config.priceBounds] as [number, number],
      });
      return;
    }
    // Single-select radio behaviour for quick price
    onChange({
      ...draft,
      pricePresets: [presetId],
      priceRange: [...config.priceBounds] as [number, number],
    });
  };

  const commitMinText = () => {
    const parsed = parsePriceInput(minText);
    if (parsed == null) {
      setMinText(String(Math.round(safeMin)));
      return;
    }
    applyCustomRange(parsed, safeMax);
  };

  const commitMaxText = () => {
    const parsed = parsePriceInput(maxText);
    if (parsed == null) {
      setMaxText(String(Math.round(safeMax)));
      return;
    }
    applyCustomRange(safeMin, parsed);
  };

  const customActive =
    draft.pricePresets.length === 0 &&
    (safeMin > minBound || safeMax < maxBound);

  return (
    <View style={{ gap: FILTER_SPACING.md }}>
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: FILTER_COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
        Quick Price
      </Text>

      <View style={{ gap: 2 }}>
        {config.pricePresets.map((preset) => {
          const selected = draft.pricePresets.includes(preset.id);
          const count = facetCounts?.[preset.id];
          return (
            <ScaledPressable
              key={preset.id}
              onPress={() => selectPreset(preset.id)}
              scaleTo={0.98}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 44,
                paddingVertical: 8,
                paddingHorizontal: 4,
                borderRadius: FILTER_RADIUS.input,
                backgroundColor: selected ? FILTER_COLORS.primaryLight : 'transparent',
              }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: selected ? FILTER_COLORS.primary : FILTER_COLORS.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}>
                {selected ? (
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: FILTER_COLORS.primary,
                    }}
                  />
                ) : null}
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 15,
                  fontWeight: selected ? '600' : '500',
                  color: FILTER_COLORS.text,
                }}>
                {preset.label}
              </Text>
              {typeof count === 'number' ? (
                <Text style={{ fontSize: 13, color: FILTER_COLORS.textMuted }}>
                  ({count})
                </Text>
              ) : null}
            </ScaledPressable>
          );
        })}
      </View>

      <View
        style={{
          height: 1,
          backgroundColor: FILTER_COLORS.divider,
          marginVertical: 2,
        }}
      />

      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: FILTER_COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
        Custom Range
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              color: FILTER_COLORS.textMuted,
              marginBottom: 6,
              fontWeight: '500',
            }}>
            Min
          </Text>
          <View
            style={{
              height: 44,
              borderRadius: FILTER_RADIUS.input,
              borderWidth: 1.5,
              borderColor: customActive ? FILTER_COLORS.primary : FILTER_COLORS.border,
              backgroundColor: FILTER_COLORS.surfaceMuted,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: FILTER_COLORS.text }}>
              ₹
            </Text>
            <BottomSheetTextInput
              value={minText}
              onChangeText={setMinText}
              onBlur={commitMinText}
              onSubmitEditing={commitMinText}
              keyboardType="number-pad"
              returnKeyType="done"
              style={{
                flex: 1,
                marginLeft: 4,
                fontSize: 15,
                fontWeight: '600',
                color: FILTER_COLORS.text,
                paddingVertical: 0,
              }}
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              color: FILTER_COLORS.textMuted,
              marginBottom: 6,
              fontWeight: '500',
            }}>
            Max
          </Text>
          <View
            style={{
              height: 44,
              borderRadius: FILTER_RADIUS.input,
              borderWidth: 1.5,
              borderColor: customActive ? FILTER_COLORS.primary : FILTER_COLORS.border,
              backgroundColor: FILTER_COLORS.surfaceMuted,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
            }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: FILTER_COLORS.text }}>
              ₹
            </Text>
            <BottomSheetTextInput
              value={maxText}
              onChangeText={setMaxText}
              onBlur={commitMaxText}
              onSubmitEditing={commitMaxText}
              keyboardType="number-pad"
              returnKeyType="done"
              style={{
                flex: 1,
                marginLeft: 4,
                fontSize: 15,
                fontWeight: '600',
                color: FILTER_COLORS.text,
                paddingVertical: 0,
              }}
            />
          </View>
        </View>
      </View>

      <DualRangeSlider
        minBound={minBound}
        maxBound={maxBound}
        low={Math.min(Math.max(safeMin, minBound), maxBound)}
        high={Math.min(Math.max(safeMax, minBound), maxBound)}
        onChange={applyCustomRange}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: -4,
        }}>
        <Text style={{ fontSize: 12, color: FILTER_COLORS.textMuted }}>
          {formatPrice(minBound)}
        </Text>
        <Text style={{ fontSize: 12, color: FILTER_COLORS.textMuted }}>
          {formatPrice(maxBound)}
        </Text>
      </View>

      {typeof matchingCount === 'number' ? (
        <View
          style={{
            marginTop: 4,
            paddingVertical: 12,
            paddingHorizontal: 14,
            borderRadius: FILTER_RADIUS.card,
            backgroundColor: FILTER_COLORS.surfaceMuted,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: FILTER_COLORS.textMuted,
            }}>
            Products Matching
          </Text>
          <MatchingCount count={matchingCount} />
        </View>
      ) : null}
    </View>
  );
}
