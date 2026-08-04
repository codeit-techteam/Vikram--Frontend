import { memo, useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';

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

/**
 * Compact price filter: quick radios + min/max inputs + dual-thumb slider.
 * Fits without nested scrolling; matching count lives in the sticky Apply bar.
 */
export const PriceRangeSection = memo(function PriceRangeSection({
  draft,
  onChange,
  config,
  facetCounts,
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
    const exists =
      draft.pricePresets.includes(presetId) && draft.pricePresets.length === 1;
    if (exists) {
      onChange({
        ...draft,
        pricePresets: [],
        priceRange: [...config.priceBounds] as [number, number],
      });
      return;
    }
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
          letterSpacing: 0.6,
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
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 48,
                paddingVertical: 8,
                paddingHorizontal: 10,
                borderRadius: FILTER_RADIUS.input,
                backgroundColor: selected
                  ? FILTER_COLORS.primaryLight
                  : 'transparent',
              }}>
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  borderWidth: 2,
                  borderColor: selected
                    ? FILTER_COLORS.primary
                    : FILTER_COLORS.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  flexShrink: 0,
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
                numberOfLines={1}
                style={{
                  flex: 1,
                  flexShrink: 1,
                  fontSize: 15,
                  fontWeight: selected ? '600' : '500',
                  color: FILTER_COLORS.text,
                }}>
                {preset.label}
              </Text>
              {typeof count === 'number' ? (
                <Text
                  numberOfLines={1}
                  style={{
                    marginLeft: 8,
                    fontSize: 13,
                    color: FILTER_COLORS.textMuted,
                    flexShrink: 0,
                  }}>
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
          marginVertical: 4,
        }}
      />

      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          color: FILTER_COLORS.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}>
        Custom Price
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 11,
              color: FILTER_COLORS.textMuted,
              marginBottom: 6,
              fontWeight: '600',
            }}>
            Min
          </Text>
          <View
            style={{
              height: 48,
              borderRadius: FILTER_RADIUS.input,
              borderWidth: 1.5,
              borderColor: customActive
                ? FILTER_COLORS.primary
                : FILTER_COLORS.border,
              backgroundColor: FILTER_COLORS.surfaceMuted,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
            }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: FILTER_COLORS.textMuted,
              }}>
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
                minWidth: 0,
              }}
            />
          </View>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 11,
              color: FILTER_COLORS.textMuted,
              marginBottom: 6,
              fontWeight: '600',
            }}>
            Max
          </Text>
          <View
            style={{
              height: 48,
              borderRadius: FILTER_RADIUS.input,
              borderWidth: 1.5,
              borderColor: customActive
                ? FILTER_COLORS.primary
                : FILTER_COLORS.border,
              backgroundColor: FILTER_COLORS.surfaceMuted,
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
            }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '700',
                color: FILTER_COLORS.textMuted,
              }}>
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
                minWidth: 0,
              }}
            />
          </View>
        </View>
      </View>

      <View style={{ marginTop: 4 }}>
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
            marginTop: 2,
            paddingHorizontal: 2,
          }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: 12, color: FILTER_COLORS.textMuted, flexShrink: 1 }}>
            {formatPrice(minBound)}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              fontSize: 12,
              color: FILTER_COLORS.textMuted,
              flexShrink: 1,
              textAlign: 'right',
            }}>
            {formatPrice(maxBound)}
          </Text>
        </View>
      </View>
    </View>
  );
});
