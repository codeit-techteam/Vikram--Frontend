import { ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { ScaledPressable } from '@components/ScaledPressable';
import {
  getChipLabel,
  countActiveFilters,
  FILTER_CHIPS,
  isDefaultAvailability,
} from '@constants/filterOptions';
import { FILTER_COLORS, FILTER_RADIUS, FILTER_SPACING } from '@constants/filterTokens';
import type {
  ActiveFilters,
  CategoryFilterConfig,
  QuickFilterKey,
} from '@/types/filter.types';

interface FilterBarProps {
  activeFilters: ActiveFilters;
  config: CategoryFilterConfig;
  onChipPress: (key: QuickFilterKey) => void;
  onOpenAll: () => void;
  onClearChip: (key: QuickFilterKey) => void;
}

function ChipBadge({ count }: { count: number }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [count, scale]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count <= 0) return null;

  return (
    <Animated.View
      style={[
        badgeStyle,
        {
          marginLeft: 6,
          minWidth: 18,
          height: 18,
          borderRadius: 9,
          backgroundColor: 'rgba(255,255,255,0.3)',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 4,
        },
      ]}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#FFFFFF' }}>{count}</Text>
    </Animated.View>
  );
}

function getChipSelectionCount(
  key: QuickFilterKey,
  filters: ActiveFilters,
  bounds: [number, number],
) {
  switch (key) {
    case 'grade':
      return filters.grade.length;
    case 'eta':
      return filters.eta ? 1 : 0;
    case 'brand':
      return filters.brand.length;
    case 'priceRange':
      return filters.priceRange[0] > bounds[0] || filters.priceRange[1] < bounds[1]
        ? 1
        : 0;
    case 'availability':
      return isDefaultAvailability(filters.availability)
        ? 0
        : filters.availability.length;
    default:
      return 0;
  }
}

function FilterChipButton({
  label,
  icon,
  isActive,
  count,
  onPress,
  onLongPress,
}: {
  label: string;
  icon?: string;
  isActive: boolean;
  count: number;
  onPress: () => void;
  onLongPress?: () => void;
}) {
  return (
    <ScaledPressable
      onPress={onPress}
      onLongPress={onLongPress}
      scaleTo={0.96}
      style={{
        height: 36,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderRadius: FILTER_RADIUS.chip,
        backgroundColor: isActive ? FILTER_COLORS.primary : FILTER_COLORS.surface,
        borderWidth: isActive ? 0 : 1,
        borderColor: FILTER_COLORS.border,
      }}>
      {icon && (
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={14}
          color={isActive ? '#FFFFFF' : FILTER_COLORS.textMuted}
          style={{ marginRight: 4 }}
        />
      )}
      <Text
        style={{
          fontSize: 13,
          fontWeight: '600',
          color: isActive ? '#FFFFFF' : FILTER_COLORS.text,
        }}
        numberOfLines={1}>
        {label}
      </Text>
      {isActive && count > 0 && <ChipBadge count={count} />}
      {!isActive && (
        <Ionicons
          name="chevron-down"
          size={12}
          color={FILTER_COLORS.textMuted}
          style={{ marginLeft: 2 }}
        />
      )}
    </ScaledPressable>
  );
}

export function FilterBar({
  activeFilters,
  config,
  onChipPress,
  onOpenAll,
  onClearChip,
}: FilterBarProps) {
  const totalActive = countActiveFilters(activeFilters, config.priceBounds);
  const visibleChips = FILTER_CHIPS.filter((chip) =>
    config.visibleChips.includes(chip.key),
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: FILTER_SPACING.lg,
        gap: FILTER_SPACING.sm,
        alignItems: 'center',
      }}
      style={{ flexGrow: 0, marginTop: FILTER_SPACING.lg }}>
      {visibleChips.map((chip) => {
        const count = getChipSelectionCount(
          chip.key,
          activeFilters,
          config.priceBounds,
        );
        const isActive = count > 0;
        const label = getChipLabel(chip.key, activeFilters, config);

        return (
          <FilterChipButton
            key={chip.key}
            label={label}
            icon={isActive ? undefined : chip.icon}
            isActive={isActive}
            count={count}
            onPress={() => onChipPress(chip.key)}
            onLongPress={isActive ? () => onClearChip(chip.key) : undefined}
          />
        );
      })}

      <FilterChipButton
        label="Filter"
        icon="options-outline"
        isActive={totalActive > 0}
        count={totalActive}
        onPress={onOpenAll}
      />
    </ScrollView>
  );
}
