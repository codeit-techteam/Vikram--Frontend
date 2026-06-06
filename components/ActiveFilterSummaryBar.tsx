import { Text, View } from 'react-native';
import Animated, { FadeInLeft, FadeOutLeft } from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import {
  formatPriceRangeLabel,
  isPriceRangeActive,
} from '@constants/filterOptions';
import { FILTER_COLORS, FILTER_SPACING } from '@constants/filterTokens';
import type { ActiveFilters, CategoryFilterConfig, FilterKey } from '@/types/filter.types';

interface ActiveFilterSummaryBarProps {
  activeFilters: ActiveFilters;
  config: CategoryFilterConfig;
  resultCount: number;
  onClearAll: () => void;
  onRemoveTag: (key: FilterKey, value?: string) => void;
}

type FilterTag = { key: FilterKey; label: string; value?: string };

function buildTags(filters: ActiveFilters, config: CategoryFilterConfig): FilterTag[] {
  const tags: FilterTag[] = [];

  for (const grade of filters.grade) {
    tags.push({ key: 'grade', label: grade, value: grade });
  }
  if (filters.eta) {
    tags.push({ key: 'eta', label: filters.eta });
  }
  if (filters.brand) {
    tags.push({ key: 'brand', label: filters.brand });
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
  for (const avail of filters.availability) {
    tags.push({ key: 'availability', label: avail, value: avail });
  }

  return tags;
}

export function ActiveFilterSummaryBar({
  activeFilters,
  config,
  resultCount,
  onClearAll,
  onRemoveTag,
}: ActiveFilterSummaryBarProps) {
  const tags = buildTags(activeFilters, config);
  if (tags.length === 0) return null;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: FILTER_SPACING.lg,
        marginTop: FILTER_SPACING.sm,
        marginBottom: FILTER_SPACING.xs,
      }}>
      <Text
        style={{
          fontSize: 13,
          color: FILTER_COLORS.textMuted,
          marginRight: FILTER_SPACING.sm,
        }}>
        {resultCount} results
      </Text>

      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: FILTER_SPACING.sm, paddingRight: FILTER_SPACING.lg }}>
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
