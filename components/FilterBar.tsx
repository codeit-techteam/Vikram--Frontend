import { useEffect } from 'react';
import { ScrollView, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import {
  getChipLabel,
  countActiveFilters,
  FILTER_CHIPS,
  isPriceRangeActive,
} from '@constants/filterOptions';
import {
  FILTER_COLORS,
  FILTER_RADIUS,
  FILTER_SPACING,
  FILTER_SPRING,
} from '@constants/filterTokens';
import type {
  ActiveFilters,
  CategoryFilterConfig,
  QuickFilterKey,
} from '@/types/filter.types';

const CHIP_HEIGHT = 44;

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
    scale.value = withSpring(1, FILTER_SPRING.press);
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
          backgroundColor: 'rgba(255,255,255,0.35)',
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
    case 'brand':
      return filters.brand.length;
    case 'priceRange':
      if (filters.pricePresets.length > 0) return filters.pricePresets.length;
      return isPriceRangeActive(filters, bounds) ? 1 : 0;
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
  showChevron = true,
}: {
  label: string;
  icon?: string;
  isActive: boolean;
  count: number;
  onPress: () => void;
  onLongPress?: () => void;
  showChevron?: boolean;
}) {
  return (
    <ScaledPressable
      onPress={onPress}
      onLongPress={onLongPress}
      scaleTo={0.96}
      style={{
        height: CHIP_HEIGHT,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        borderRadius: FILTER_RADIUS.chip + 4,
        backgroundColor: isActive ? FILTER_COLORS.primary : FILTER_COLORS.surface,
        borderWidth: isActive ? 0 : 1,
        borderColor: FILTER_COLORS.border,
      }}>
      {icon ? (
        <Ionicons
          name={icon as keyof typeof Ionicons.glyphMap}
          size={15}
          color={isActive ? '#FFFFFF' : FILTER_COLORS.textMuted}
          style={{ marginRight: 6 }}
        />
      ) : null}
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: isActive ? '#FFFFFF' : FILTER_COLORS.text,
        }}
        numberOfLines={1}>
        {label}
      </Text>
      {isActive && count > 0 ? <ChipBadge count={count} /> : null}
      {showChevron && !isActive ? (
        <Ionicons
          name="chevron-down"
          size={14}
          color={FILTER_COLORS.textMuted}
          style={{ marginLeft: 4 }}
        />
      ) : null}
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
        paddingVertical: 2,
      }}
      style={{ flexGrow: 0, marginTop: FILTER_SPACING.md }}>
      <FilterChipButton
        label="Filters"
        icon="options-outline"
        isActive={totalActive > 0}
        count={totalActive}
        onPress={onOpenAll}
        showChevron={totalActive === 0}
      />

      {visibleChips.map((chip) => {
        const count = getChipSelectionCount(
          chip.key,
          activeFilters,
          config.priceBounds,
        );
        const isActive = count > 0;
        const label = isActive
          ? chip.label
          : getChipLabel(chip.key, activeFilters, config);

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
    </ScrollView>
  );
}
