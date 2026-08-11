import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import {
  formatPriceRangeLabel,
  getPricePresetLabel,
  isPriceRangeActive,
  SORT_OPTIONS,
} from '@constants/filterOptions';
import { FILTER_COLORS, FILTER_SPACING } from '@constants/filterTokens';
import type { ActiveFilters, CategoryFilterConfig, FilterKey } from '@/types/filter.types';

export type RemovableFilterKey = FilterKey | 'search' | 'pricePresets';

interface ActiveFilterSummaryBarProps {
  activeFilters: ActiveFilters;
  config: CategoryFilterConfig;
  resultCount?: number;
  onClearAll: () => void;
  onRemoveTag: (key: RemovableFilterKey, value?: string) => void;
}

type FilterTag = { key: RemovableFilterKey; label: string; value?: string };

function buildTags(filters: ActiveFilters, config: CategoryFilterConfig): FilterTag[] {
  const tags: FilterTag[] = [];

  if (filters.search.trim()) {
    tags.push({ key: 'search', label: `"${filters.search.trim()}"` });
  }

  for (const brand of filters.brand) {
    tags.push({ key: 'brand', label: brand, value: brand });
  }
  for (const productType of filters.productType ?? []) {
    tags.push({ key: 'productType', label: productType, value: productType });
  }
  for (const grade of filters.grade) {
    tags.push({ key: 'grade', label: grade, value: grade });
  }
  if (filters.pricePresets.length > 0) {
    for (const presetId of filters.pricePresets) {
      tags.push({
        key: 'pricePresets',
        label: getPricePresetLabel(presetId, config),
        value: presetId,
      });
    }
  } else if (isPriceRangeActive(filters, config.priceBounds)) {
    tags.push({
      key: 'priceRange',
      label: formatPriceRangeLabel(
        filters.priceRange[0],
        filters.priceRange[1],
        config.priceBounds,
      ),
    });
  }
  if (filters.discount != null) {
    tags.push({ key: 'discount', label: `${filters.discount}%+ OFF` });
  }
  if (filters.bulkPricing === true) {
    tags.push({ key: 'bulkPricing', label: 'Bulk Pricing' });
  } else if (filters.bulkPricing === false) {
    tags.push({ key: 'bulkPricing', label: 'No Bulk' });
  }
  if (filters.sort !== 'recommended') {
    const sortLabel =
      SORT_OPTIONS.find((o) => o.key === filters.sort)?.label ?? filters.sort;
    tags.push({ key: 'sort', label: sortLabel });
  }

  return tags;
}

export function ActiveFilterSummaryBar({
  activeFilters,
  config,
  onClearAll,
  onRemoveTag,
}: ActiveFilterSummaryBarProps) {
  const tags = buildTags(activeFilters, config);
  if (tags.length === 0) return null;

  return (
    <View
      style={{
        paddingLeft: FILTER_SPACING.lg,
        marginTop: FILTER_SPACING.sm,
        marginBottom: FILTER_SPACING.xs,
      }}>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: FILTER_SPACING.sm,
          paddingRight: FILTER_SPACING.lg,
          alignItems: 'center',
        }}>
        {tags.map((tag) => (
          <Animated.View
            key={`${tag.key}-${tag.value ?? tag.label}`}
            entering={FadeInLeft.duration(200)}
            exiting={FadeOutLeft.duration(150)}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: 32,
                paddingHorizontal: 12,
                borderRadius: 16,
                backgroundColor: FILTER_COLORS.primary,
                gap: 6,
              }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 13, color: '#FFFFFF', fontWeight: '700' }}>
                {tag.label}
              </Text>
              <ScaledPressable
                onPress={() => onRemoveTag(tag.key, tag.value)}
                hitSlop={8}
                accessibilityLabel={`Remove ${tag.label} filter`}>
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </ScaledPressable>
            </View>
          </Animated.View>
        ))}

        <ScaledPressable onPress={onClearAll} hitSlop={6}>
          <Text style={{ fontSize: 13, color: FILTER_COLORS.primary, fontWeight: '700' }}>
            Clear All
          </Text>
        </ScaledPressable>
      </Animated.ScrollView>
    </View>
  );
}
