import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ScrollView, Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
  BottomSheetTextInput,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { BrandSection } from '@components/filter-sections/BrandSection';
import { GradeSection } from '@components/filter-sections/GradeSection';
import { PriceRangeSection } from '@components/filter-sections/PriceRangeSection';
import { ScaledPressable } from '@components/ScaledPressable';
import {
  computeFacetCounts,
  countActiveFilters,
} from '@constants/filterOptions';
import { FILTER_COLORS, FILTER_RADIUS, FILTER_SPACING } from '@constants/filterTokens';
import type {
  ActiveFilters,
  CategoryFilterConfig,
  FilterKey,
} from '@/types/filter.types';
import type { Product } from '@/types/catalog';

export interface FilterBottomSheetRef {
  open: () => void;
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
  priceRange: 'Price',
  grade: 'Grade',
};

function sectionHasSelection(
  key: FilterKey,
  draft: ActiveFilters,
  bounds: [number, number],
): boolean {
  switch (key) {
    case 'brand':
      return draft.brand.length > 0;
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

export const FilterBottomSheet = forwardRef<FilterBottomSheetRef, FilterBottomSheetProps>(
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
    const snapPoints = useMemo(() => ['90%'], []);
    const sections = config.advancedSections;
    const [activeSection, setActiveSection] = useState<FilterKey>(
      sections[0] ?? 'brand',
    );
    const [filterQuery, setFilterQuery] = useState('');

    useEffect(() => {
      if (!sections.includes(activeSection) && sections.length > 0) {
        setActiveSection(sections[0]);
      }
    }, [sections, activeSection]);

    useImperativeHandle(ref, () => ({
      open: () => {
        setFilterQuery('');
        setActiveSection(sections[0] ?? 'brand');
        sheetRef.current?.snapToIndex(0);
      },
      close: () => sheetRef.current?.close(),
    }));

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.55}
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
    const priceCounts = useMemo(
      () => computeFacetCounts(products, draft, config, categoryId, 'price'),
      [products, draft, config, categoryId],
    );

    const handleApply = () => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onApply();
      sheetRef.current?.close();
    };

    const handleClearAll = () => {
      void Haptics.selectionAsync();
      onClearAll();
      sheetRef.current?.close();
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
            />
          );
        case 'grade':
          return <GradeSection {...sectionProps} facetCounts={gradeCounts} />;
        case 'priceRange':
          return (
            <PriceRangeSection
              {...sectionProps}
              facetCounts={priceCounts}
              matchingCount={resultCount}
            />
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
        animateOnMount
        animationConfigs={{
          damping: 22,
          stiffness: 220,
          mass: 0.8,
          overshootClamping: false,
          energyThreshold: 0.01,
        }}
        backdropComponent={renderBackdrop}
        bottomInset={insets.bottom}
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        handleIndicatorStyle={{
          width: 36,
          height: 4,
          backgroundColor: '#D1D1D1',
        }}
        backgroundStyle={{
          backgroundColor: FILTER_COLORS.surface,
          borderTopLeftRadius: FILTER_RADIUS.sheet,
          borderTopRightRadius: FILTER_RADIUS.sheet,
        }}>
        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: FILTER_SPACING.lg,
              paddingTop: FILTER_SPACING.sm,
              paddingBottom: FILTER_SPACING.md,
            }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: FILTER_COLORS.text,
              }}>
              Filters
            </Text>
            {activeDraftCount > 0 ? (
              <ScaledPressable onPress={handleClearAll} hitSlop={8}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: FILTER_COLORS.primary,
                  }}>
                  Clear All
                </Text>
              </ScaledPressable>
            ) : null}
          </View>

          {showSearch ? (
            <View
              style={{
                marginHorizontal: FILTER_SPACING.lg,
                marginBottom: FILTER_SPACING.md,
                flexDirection: 'row',
                alignItems: 'center',
                height: 44,
                borderRadius: FILTER_RADIUS.input,
                borderWidth: 1,
                borderColor: FILTER_COLORS.border,
                paddingHorizontal: 12,
                backgroundColor: FILTER_COLORS.surfaceMuted,
              }}>
              <Ionicons name="search" size={16} color={FILTER_COLORS.textMuted} />
              <BottomSheetTextInput
                value={filterQuery}
                onChangeText={setFilterQuery}
                placeholder="Search Brand"
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
                <ScaledPressable onPress={() => setFilterQuery('')} hitSlop={8}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={FILTER_COLORS.textMuted}
                  />
                </ScaledPressable>
              ) : null}
            </View>
          ) : null}

          <View style={{ flex: 1, flexDirection: 'row' }}>
            <ScrollView
              style={{
                width: 108,
                backgroundColor: FILTER_COLORS.surfaceMuted,
                borderRightWidth: 1,
                borderRightColor: FILTER_COLORS.divider,
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}>
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
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setActiveSection(key);
                      setFilterQuery('');
                    }}
                    scaleTo={0.98}
                    style={{
                      paddingVertical: 18,
                      paddingHorizontal: 12,
                      backgroundColor: active
                        ? FILTER_COLORS.surface
                        : 'transparent',
                      borderLeftWidth: 3,
                      borderLeftColor: active
                        ? FILTER_COLORS.primary
                        : 'transparent',
                    }}>
                    <Text
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
                          marginTop: 4,
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
            </ScrollView>

            {isPrice ? (
              <View
                style={{
                  flex: 1,
                  paddingHorizontal: FILTER_SPACING.md,
                  paddingTop: FILTER_SPACING.sm,
                }}>
                {renderActiveSection()}
              </View>
            ) : (
              <BottomSheetScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: FILTER_SPACING.md,
                  paddingTop: FILTER_SPACING.sm,
                  paddingBottom: FILTER_SPACING.xl,
                  flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">
                {renderActiveSection()}
              </BottomSheetScrollView>
            )}
          </View>

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: FILTER_COLORS.divider,
              paddingHorizontal: FILTER_SPACING.lg,
              paddingTop: FILTER_SPACING.md,
              paddingBottom: FILTER_SPACING.lg,
              flexDirection: 'row',
              gap: FILTER_SPACING.sm,
              backgroundColor: FILTER_COLORS.surface,
            }}>
            <ScaledPressable
              onPress={() => {
                void Haptics.selectionAsync();
                onReset();
                sheetRef.current?.close();
              }}
              scaleTo={0.97}
              style={{
                flex: 1,
                height: 52,
                borderRadius: FILTER_RADIUS.card,
                borderWidth: 1.5,
                borderColor: FILTER_COLORS.primary,
                backgroundColor: FILTER_COLORS.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '700',
                  color: FILTER_COLORS.primary,
                }}>
                Clear All
              </Text>
            </ScaledPressable>

            <ScaledPressable
              onPress={handleApply}
              scaleTo={0.97}
              style={{
                flex: 1.35,
                height: 52,
                borderRadius: FILTER_RADIUS.card,
                backgroundColor: FILTER_COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                Apply ({resultCount} {resultCount === 1 ? 'Product' : 'Products'})
              </Text>
            </ScaledPressable>
          </View>
        </View>
      </BottomSheet>
    );
  },
);

FilterBottomSheet.displayName = 'FilterBottomSheet';
