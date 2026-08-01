import { Text, View } from 'react-native';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import {
  formatPriceRangeLabel,
  isDefaultAvailability,
  isPriceRangeActive,
  SORT_OPTIONS,
} from '@constants/filterOptions';
import { FILTER_COLORS, FILTER_SPACING } from '@constants/filterTokens';
import type { ActiveFilters, CategoryFilterConfig, FilterKey } from '@/types/filter.types';

export type RemovableFilterKey = FilterKey | 'search';

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
    tags.push({ key: 'brand', label: `Brand: ${brand}`, value: brand });
  }
  for (const grade of filters.grade) {
    tags.push({ key: 'grade', label: grade, value: grade });
  }
  if (filters.eta) {
    tags.push({ key: 'eta', label: filters.eta });
  }
  if (isPriceRangeActive(filters, config.priceBounds)) {
    tags.push({
      key: 'priceRange',
      label: formatPriceRangeLabel(
        filters.priceRange[0],
        filters.priceRange[1],
        config.priceBounds,
      ),
    });
  }
  if (!isDefaultAvailability(filters.availability)) {
    for (const avail of filters.availability) {
      tags.push({ key: 'availability', label: avail, value: avail });
    }
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
            key={`${tag.key}-${tag.label}`}
            entering={FadeInLeft.duration(200)}
            exiting={FadeOutLeft.duration(150)}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                height: 28,
                paddingHorizontal: 10,
                borderRadius: 16,
                backgroundColor: FILTER_COLORS.primaryLight,
              }}>
              <Text style={{ fontSize: 13, color: FILTER_COLORS.primary, fontWeight: '500' }}>
                {tag.label}
              </Text>
              <ScaledPressable
                onPress={() => onRemoveTag(tag.key, tag.value)}
                hitSlop={8}
                style={{ marginLeft: 6 }}>
                <Text style={{ fontSize: 16, color: FILTER_COLORS.primary, lineHeight: 18 }}>
                  ×
                </Text>
              </ScaledPressable>
            </View>
          </Animated.View>
        ))}

        <ScaledPressable onPress={onClearAll}>
          <Text style={{ fontSize: 13, color: FILTER_COLORS.primary, fontWeight: '600' }}>
            Clear all
          </Text>
        </ScaledPressable>
      </Animated.ScrollView>
    </View>
  );
}
