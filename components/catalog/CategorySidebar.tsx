import { memo, useCallback } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { ScaledPressable } from '@components/ScaledPressable';
import type {
  CategoryRailItem,
  CategoryRailSelection,
} from '@hooks/useCategoryFacets';

/**
 * Roughly a fifth of the screen, clamped so the rail stays legible on small
 * phones without eating the grid on tablets.
 */
export function getCategorySidebarWidth(screenWidth: number): number {
  return Math.round(Math.min(96, Math.max(70, screenWidth * 0.21)));
}

const PRIMARY = '#FEB623';
const PRIMARY_TINT = '#FFF8E7';
const DARK = '#1A1A1A';
const MUTED = '#7A7A7A';

function isSelected(
  item: CategoryRailItem,
  selection: CategoryRailSelection,
): boolean {
  return item.kind === selection.kind && item.value === selection.value;
}

/** Two-letter monogram used when a brand has no logo uploaded in Admin. */
function initialsFor(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

interface SidebarRowProps {
  item: CategoryRailItem;
  selected: boolean;
  onSelect: (selection: CategoryRailSelection) => void;
}

function SidebarRowComponent({ item, selected, onSelect }: SidebarRowProps) {
  const handlePress = useCallback(
    () => onSelect({ kind: item.kind, value: item.value }),
    [item.kind, item.value, onSelect],
  );

  return (
    <View>
      {item.sectionLabel ? (
        <Text style={styles.sectionLabel}>{item.sectionLabel}</Text>
      ) : null}

      <ScaledPressable
        onPress={handlePress}
        scaleTo={0.96}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        accessibilityLabel={`${item.label}, ${item.productCount} ${
          item.productCount === 1 ? 'product' : 'products'
        }`}
        style={[styles.row, selected && styles.rowSelected]}>
        {selected ? <View style={styles.indicator} /> : null}

        <View style={[styles.thumb, selected && styles.thumbSelected]}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={
                item.imageFit === 'cover' ? styles.thumbImageFill : styles.thumbImage
              }
              contentFit={item.imageFit}
              transition={120}
              recyclingKey={item.key}
            />
          ) : (
            <Text
              style={[styles.monogram, selected && styles.monogramSelected]}
              numberOfLines={1}>
              {initialsFor(item.label)}
            </Text>
          )}
        </View>

        <Text
          style={[styles.label, selected && styles.labelSelected]}
          numberOfLines={2}>
          {item.label}
        </Text>
      </ScaledPressable>
    </View>
  );
}

const SidebarRow = memo(SidebarRowComponent);

export function CategorySidebarSkeleton({ width }: { width: number }) {
  return (
    <View style={[styles.container, { width }]}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index} style={styles.skeletonRow}>
          <View style={styles.skeletonThumb} />
          <View style={styles.skeletonLabel} />
        </View>
      ))}
    </View>
  );
}

interface CategorySidebarProps {
  items: CategoryRailItem[];
  selection: CategoryRailSelection;
  onSelect: (selection: CategoryRailSelection) => void;
  width: number;
  isLoading?: boolean;
}

function CategorySidebarComponent({
  items,
  selection,
  onSelect,
  width,
  isLoading = false,
}: CategorySidebarProps) {
  const renderItem = useCallback(
    ({ item }: { item: CategoryRailItem }) => (
      <SidebarRow
        item={item}
        selected={isSelected(item, selection)}
        onSelect={onSelect}
      />
    ),
    [onSelect, selection],
  );

  if (isLoading && items.length === 0) return <CategorySidebarSkeleton width={width} />;
  if (items.length === 0) return null;

  return (
    <View style={[styles.container, { width }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        // The rail is short and fully interactive; virtualising it causes blank
        // rows while the product grid is scrolling alongside it.
        initialNumToRender={Math.min(items.length, 20)}
        windowSize={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRightColor: '#EAEAEA',
    borderRightWidth: StyleSheet.hairlineWidth,
  },
  indicator: {
    backgroundColor: PRIMARY,
    borderBottomLeftRadius: 3,
    borderTopLeftRadius: 3,
    bottom: 12,
    position: 'absolute',
    right: 0,
    top: 12,
    width: 3,
  },
  label: {
    color: MUTED,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 13,
    marginTop: 6,
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  labelSelected: {
    color: DARK,
    fontWeight: '800',
  },
  listContent: {
    paddingBottom: 32,
    paddingTop: 6,
  },
  monogram: {
    color: MUTED,
    fontSize: 15,
    fontWeight: '800',
  },
  monogramSelected: {
    color: DARK,
  },
  row: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    minHeight: 78,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  rowSelected: {
    backgroundColor: PRIMARY_TINT,
  },
  sectionLabel: {
    color: '#B0B0B0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingBottom: 4,
    paddingHorizontal: 8,
    paddingTop: 12,
    textTransform: 'uppercase',
  },
  skeletonLabel: {
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    height: 9,
    marginTop: 8,
    width: 48,
  },
  skeletonRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  skeletonThumb: {
    backgroundColor: '#EFEFEF',
    borderRadius: 23,
    height: 46,
    width: 46,
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: '#F6F6F6',
    borderColor: 'transparent',
    borderRadius: 23,
    borderWidth: 1.5,
    height: 46,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 46,
  },
  thumbImage: {
    height: '78%',
    width: '78%',
  },
  thumbImageFill: {
    height: '100%',
    width: '100%',
  },
  thumbSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: PRIMARY,
  },
});

export const CategorySidebar = memo(CategorySidebarComponent);
