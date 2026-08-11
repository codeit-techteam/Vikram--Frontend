import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { BrandSection } from '@components/filter-sections/BrandSection';
import { GradeSection } from '@components/filter-sections/GradeSection';
import { PriceRangeSection } from '@components/filter-sections/PriceRangeSection';
import { ProductTypeSection } from '@components/filter-sections/ProductTypeSection';
import { FilterFooter } from '@components/FilterFooter';
import { ScaledPressable } from '@components/ScaledPressable';
import {
  computeFacetCounts,
  countActiveFilters,
} from '@constants/filterOptions';
import {
  FILTER_COLORS,
  FILTER_LAYOUT,
  FILTER_RADIUS,
  FILTER_SPACING,
  FILTER_SPRING,
} from '@constants/filterTokens';
import type {
  ActiveFilters,
  CategoryFilterConfig,
  FilterKey,
} from '@/types/filter.types';
import type { Product } from '@/types/catalog';

export interface FilterBottomSheetRef {
  /** Open unified sheet; optionally jump to Brand / Type / Grade / Price. */
  open: (section?: FilterKey) => void;
  close: () => void;
}

interface FilterBottomSheetProps {
  draft: ActiveFilters;
  config: CategoryFilterConfig;
  products: Product[];
  categoryId: string;
  resultCount: number;
  onChange: (draft: ActiveFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onClearAll: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  brand: 'Brand',
  productType: 'Type',
  priceRange: 'Price',
  grade: 'Grade',
};

const SIDEBAR_SECTIONS: FilterKey[] = [
  'productType',
  'brand',
  'grade',
  'priceRange',
];

function sectionHasSelection(
  key: FilterKey,
  draft: ActiveFilters,
  bounds: [number, number],
): boolean {
  switch (key) {
    case 'brand':
      return draft.brand.length > 0;
    case 'productType':
      return (draft.productType?.length ?? 0) > 0;
    case 'grade':
      return draft.grade.length > 0;
    case 'priceRange':
      return (
        draft.pricePresets.length > 0 ||
        draft.priceRange[0] > bounds[0] ||
        draft.priceRange[1] < bounds[1]
      );
    default:
      return false;
  }
}

export const FilterBottomSheet = forwardRef<
  FilterBottomSheetRef,
  FilterBottomSheetProps
>(
  (
    {
      draft,
      config,
      products,
      categoryId,
      resultCount,
      onChange,
      onApply,
      onReset,
      onClearAll,
    },
    ref,
  ) => {
    const sheetRef = useRef<BottomSheet>(null);
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => [FILTER_LAYOUT.snapPercent], []);
    const sections = useMemo(
      () =>
        SIDEBAR_SECTIONS.filter((key) =>
          config.advancedSections.includes(key),
        ),
      [config.advancedSections],
    );
    const [activeSection, setActiveSection] = useState<FilterKey>(
      sections[0] ?? 'brand',
    );
    const [filterQuery, setFilterQuery] = useState('');
    const [contentKey, setContentKey] = useState(0);

    useEffect(() => {
      if (!sections.includes(activeSection) && sections.length > 0) {
        setActiveSection(sections[0]);
      }
    }, [sections, activeSection]);

    useImperativeHandle(ref, () => ({
      open: (section?: FilterKey) => {
        setFilterQuery('');
        const target =
          section && sections.includes(section)
            ? section
            : (sections[0] ?? 'brand');
        setActiveSection(target);
        setContentKey((k) => k + 1);
        requestAnimationFrame(() => {
          sheetRef.current?.snapToIndex(0);
        });
      },
      close: () => sheetRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          pressBehavior="close"
        />
      ),
      [],
    );

    const activeDraftCount = countActiveFilters(draft, config.priceBounds);

    const brandCounts = useMemo(
      () => computeFacetCounts(products, draft, config, categoryId, 'brand'),
      [products, draft, config, categoryId],
    );
    const gradeCounts = useMemo(
      () => computeFacetCounts(products, draft, config, categoryId, 'grade'),
      [products, draft, config, categoryId],
    );
    const productTypeCounts = useMemo(
      () =>
        computeFacetCounts(products, draft, config, categoryId, 'productType'),
      [products, draft, config, categoryId],
    );
    const priceCounts = useMemo(
      () => computeFacetCounts(products, draft, config, categoryId, 'price'),
      [products, draft, config, categoryId],
    );

    const handleApply = () => {
      onApply();
      sheetRef.current?.close();
    };

    const handleClearAll = () => {
      void Haptics.selectionAsync();
      onClearAll();
      sheetRef.current?.close();
    };

    const handleClose = () => {
      sheetRef.current?.close();
    };

    const selectSection = (key: FilterKey) => {
      if (key === activeSection) return;
      void Haptics.selectionAsync();
      setActiveSection(key);
      setFilterQuery('');
      setContentKey((k) => k + 1);
    };

    const sectionProps = { draft, onChange, config, products };

    const renderActiveSection = () => {
      switch (activeSection) {
        case 'brand':
          return (
            <BrandSection
              {...sectionProps}
              facetCounts={brandCounts}
              externalSearch={filterQuery}
              hideSearch
            />
          );
        case 'productType':
          return (
            <ProductTypeSection
              {...sectionProps}
              facetCounts={productTypeCounts}
            />
          );
        case 'grade':
          return <GradeSection {...sectionProps} facetCounts={gradeCounts} />;
        case 'priceRange':
          return (
            <PriceRangeSection {...sectionProps} facetCounts={priceCounts} />
          );
        default:
          return null;
      }
    };

    const showSearch = activeSection === 'brand';
    const isPrice = activeSection === 'priceRange';

    return (
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDynamicSizing={false}
        animateOnMount
        animationConfigs={FILTER_SPRING.sheet}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          width: 40,
          height: 4,
          backgroundColor: '#D0D0D0',
        }}
        backgroundStyle={{
          backgroundColor: FILTER_COLORS.surface,
          borderTopLeftRadius: FILTER_RADIUS.sheet,
          borderTopRightRadius: FILTER_RADIUS.sheet,
        }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize">
        <View style={{ flex: 1 }}>
          {/* Sticky header */}
          <View
            style={{
              paddingHorizontal: FILTER_SPACING.xl,
              paddingTop: FILTER_SPACING.xs,
              paddingBottom: FILTER_SPACING.md,
              borderBottomWidth: showSearch ? 0 : StyleSheet.hairlineWidth,
              borderBottomColor: FILTER_COLORS.divider,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                minHeight: 40,
              }}>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '800',
                  color: FILTER_COLORS.text,
                  letterSpacing: -0.3,
                }}>
                Filters
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {activeDraftCount > 0 ? (
                  <ScaledPressable onPress={handleClearAll} hitSlop={8}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '700',
                        color: FILTER_COLORS.primary,
                      }}>
                      Clear All
                    </Text>
                  </ScaledPressable>
                ) : null}
                <ScaledPressable
                  onPress={handleClose}
                  hitSlop={10}
                  accessibilityLabel="Close filters"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: FILTER_COLORS.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <Ionicons name="close" size={20} color={FILTER_COLORS.text} />
                </ScaledPressable>
              </View>
            </View>

            {showSearch ? (
              <View
                style={{
                  marginTop: FILTER_SPACING.sm,
                  flexDirection: 'row',
                  alignItems: 'center',
                  height: 44,
                  borderRadius: FILTER_RADIUS.input,
                  borderWidth: 1,
                  borderColor: FILTER_COLORS.border,
                  paddingHorizontal: 12,
                  backgroundColor: FILTER_COLORS.surfaceMuted,
                }}>
                <Ionicons
                  name="search"
                  size={16}
                  color={FILTER_COLORS.textMuted}
                />
                <BottomSheetTextInput
                  value={filterQuery}
                  onChangeText={setFilterQuery}
                  placeholder="Search brands"
                  placeholderTextColor={FILTER_COLORS.textMuted}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    fontSize: 14,
                    color: FILTER_COLORS.text,
                    paddingVertical: 0,
                  }}
                />
                {filterQuery.length > 0 ? (
                  <ScaledPressable
                    onPress={() => setFilterQuery('')}
                    hitSlop={8}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={FILTER_COLORS.textMuted}
                    />
                  </ScaledPressable>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* Sidebar + content */}
          <View style={{ flex: 1, flexDirection: 'row', minHeight: 0 }}>
            <View
              style={{
                width: FILTER_LAYOUT.sidebarWidth,
                backgroundColor: FILTER_COLORS.sidebar,
                borderRightWidth: 1,
                borderRightColor: FILTER_COLORS.divider,
              }}>
              {sections.map((key) => {
                const active = activeSection === key;
                const hasValue = sectionHasSelection(
                  key,
                  draft,
                  config.priceBounds,
                );
                return (
                  <ScaledPressable
                    key={key}
                    onPress={() => selectSection(key)}
                    scaleTo={0.98}
                    style={{
                      minHeight: FILTER_LAYOUT.touchMin,
                      paddingVertical: 16,
                      paddingHorizontal: 10,
                      backgroundColor: active
                        ? FILTER_COLORS.surface
                        : 'transparent',
                      borderLeftWidth: 3,
                      borderLeftColor: active
                        ? FILTER_COLORS.primary
                        : 'transparent',
                    }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 13,
                        fontWeight: active || hasValue ? '700' : '500',
                        color: active
                          ? FILTER_COLORS.primary
                          : hasValue
                            ? FILTER_COLORS.text
                            : FILTER_COLORS.textMuted,
                      }}>
                      {SECTION_LABELS[key] ?? key}
                    </Text>
                    {hasValue ? (
                      <View
                        style={{
                          marginTop: 5,
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: FILTER_COLORS.primary,
                        }}
                      />
                    ) : null}
                  </ScaledPressable>
                );
              })}
            </View>

            {isPrice ? (
              <View
                style={{
                  flex: 1,
                  minWidth: 0,
                  paddingHorizontal: FILTER_SPACING.lg,
                  paddingTop: FILTER_SPACING.md,
                  paddingBottom: FILTER_SPACING.sm,
                }}>
                <Animated.View
                  key={`price-${contentKey}`}
                  entering={FadeIn.duration(160)}
                  exiting={FadeOut.duration(80)}
                  style={{ flex: 1 }}>
                  {renderActiveSection()}
                </Animated.View>
              </View>
            ) : (
              <BottomSheetScrollView
                style={{ flex: 1, minWidth: 0 }}
                contentContainerStyle={{
                  paddingHorizontal: FILTER_SPACING.lg,
                  paddingTop: FILTER_SPACING.md,
                  paddingBottom: FILTER_SPACING.xl,
                  flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}>
                <Animated.View
                  key={`${activeSection}-${contentKey}`}
                  entering={FadeIn.duration(160)}
                  exiting={FadeOut.duration(80)}>
                  {renderActiveSection()}
                </Animated.View>
              </BottomSheetScrollView>
            )}
          </View>

          {/* Sticky action bar — sheet uses enablePanDownToClose; safe padding via insets */}
          <View style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
            <FilterFooter
              resultCount={resultCount}
              onReset={() => {
                onReset();
              }}
              onApply={handleApply}
              applyLabel="Apply"
              resetLabel="Clear All"
              safeAreaBottom={false}
            />
          </View>
        </View>
      </BottomSheet>
    );
  },
);

FilterBottomSheet.displayName = 'FilterBottomSheet';
