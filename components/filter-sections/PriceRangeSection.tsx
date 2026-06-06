import { Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import { PRICE_PRESETS } from '@constants/filterOptions';
import { FILTER_COLORS, FILTER_RADIUS } from '@constants/filterTokens';
import type { FilterSectionProps } from '@/types/filter.types';

function formatPrice(value: number) {
  return `₹${value.toLocaleString('en-IN')}`;
}

export function PriceRangeSection({ draft, onChange, config }: FilterSectionProps) {
  const [minBound, maxBound] = config.priceBounds;
  const [minVal, maxVal] = draft.priceRange;

  const setMin = (value: number) => {
    const clamped = Math.min(Math.round(value), maxVal - 100);
    onChange({ ...draft, priceRange: [Math.max(minBound, clamped), maxVal] });
  };

  const setMax = (value: number) => {
    const clamped = Math.max(Math.round(value), minVal + 100);
    onChange({ ...draft, priceRange: [minVal, Math.min(maxBound, clamped)] });
  };

  const applyPreset = (range: [number, number]) => {
    void Haptics.selectionAsync();
    const min = Math.max(minBound, range[0]);
    const max = Math.min(maxBound, range[1] === 100000 ? maxBound : range[1]);
    onChange({ ...draft, priceRange: [min, max] });
  };

  const isPresetActive = (range: [number, number]) =>
    draft.priceRange[0] === Math.max(minBound, range[0]) &&
    draft.priceRange[1] === Math.min(maxBound, range[1] === 100000 ? maxBound : range[1]);

  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}>
        <Text style={{ fontSize: 14, fontWeight: '600', color: FILTER_COLORS.text }}>
          {formatPrice(minVal)}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: '600', color: FILTER_COLORS.text }}>
          {formatPrice(maxVal)}
        </Text>
      </View>

      <View style={{ marginBottom: 8 }}>
        <Text style={{ fontSize: 11, color: FILTER_COLORS.textMuted, marginBottom: 4 }}>
          Min price
        </Text>
        <Slider
          minimumValue={minBound}
          maximumValue={maxBound}
          value={minVal}
          onValueChange={setMin}
          minimumTrackTintColor={FILTER_COLORS.border}
          maximumTrackTintColor={FILTER_COLORS.border}
          thumbTintColor={FILTER_COLORS.surface}
          style={{ height: 40 }}
        />
      </View>

      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 11, color: FILTER_COLORS.textMuted, marginBottom: 4 }}>
          Max price
        </Text>
        <Slider
          minimumValue={minBound}
          maximumValue={maxBound}
          value={maxVal}
          onValueChange={setMax}
          minimumTrackTintColor={FILTER_COLORS.primary}
          maximumTrackTintColor={FILTER_COLORS.border}
          thumbTintColor={FILTER_COLORS.surface}
          style={{ height: 40 }}
        />
      </View>

      <View className="flex-row flex-wrap" style={{ gap: 8 }}>
        {PRICE_PRESETS.map((preset) => {
          const active = isPresetActive(preset.range);
          return (
            <ScaledPressable
              key={preset.label}
              onPress={() => applyPreset(preset.range)}
              scaleTo={0.95}
              style={{
                height: 36,
                paddingHorizontal: 12,
                borderRadius: FILTER_RADIUS.input,
                backgroundColor: active ? FILTER_COLORS.primaryLight : '#F5F5F5',
                borderWidth: active ? 1.5 : 0,
                borderColor: FILTER_COLORS.primaryBorder,
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: active ? FILTER_COLORS.primary : '#333333',
                }}>
                {preset.label}
              </Text>
            </ScaledPressable>
          );
        })}
      </View>
    </View>
  );
}
