import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FilterFooter } from '@components/FilterFooter';
import { FilterSections } from '@components/FilterSections';
import { ScaledPressable } from '@components/ScaledPressable';
import {
  createDefaultFilters,
  isDefaultAvailability,
} from '@constants/filterOptions';
import { getQuickFilterSnapPoints } from '@constants/filterSnapPoints';
import { FILTER_COLORS, FILTER_RADIUS, FILTER_SPACING } from '@constants/filterTokens';
import type {
  ActiveFilters,
  CategoryFilterConfig,
  QuickFilterKey,
} from '@/types/filter.types';
import type { Product } from '@/types/catalog';

export interface QuickFilterSheetRef {
  open: (key: QuickFilterKey) => void;
  close: () => void;
}

interface QuickFilterSheetProps {
  draft: ActiveFilters;
  config: CategoryFilterConfig;
  products: Product[];
  resultCount: number;
  onChange: (draft: ActiveFilters) => void;
  onApply: () => void;
  onClearSection: (key: QuickFilterKey) => void;
}

const FILTER_TITLES: Record<QuickFilterKey, string> = {
  grade: 'Grade',
  eta: 'ETA',
  brand: 'Brands',
  priceRange: 'Price',
  availability: 'Availability',
};

function clearSectionFromDraft(
  draft: ActiveFilters,
  key: QuickFilterKey,
  bounds: [number, number],
) {
  const next = { ...draft };
  switch (key) {
    case 'grade':
      next.grade = [];
      break;
    case 'eta':
      next.eta = null;
      break;
    case 'brand':
      next.brand = [];
      break;
    case 'priceRange':
      next.priceRange = [...bounds] as [number, number];
      break;
    case 'availability':
      next.availability = [...createDefaultFilters(bounds).availability];
      break;
  }
  return next;
}

function isSectionActive(
  draft: ActiveFilters,
  key: QuickFilterKey,
  bounds: [number, number],
) {
  switch (key) {
    case 'grade':
      return draft.grade.length > 0;
    case 'eta':
      return draft.eta !== null;
    case 'brand':
      return draft.brand.length > 0;
    case 'priceRange':
      return draft.priceRange[0] > bounds[0] || draft.priceRange[1] < bounds[1];
    case 'availability':
      return !isDefaultAvailability(draft.availability);
    default:
      return false;
  }
}

export const QuickFilterSheet = forwardRef<QuickFilterSheetRef, QuickFilterSheetProps>(
  ({ draft, config, products, resultCount, onChange, onApply, onClearSection }, ref) => {
    const sheetRef = useRef<BottomSheet>(null);
    const insets = useSafeAreaInsets();
    const [activeKey, setActiveKey] = useState<QuickFilterKey>('brand');

    const snapPoints = useMemo(
      () => getQuickFilterSnapPoints(activeKey),
      [activeKey],
    );

    useImperativeHandle(ref, () => ({
      open: (key: QuickFilterKey) => {
        setActiveKey(key);
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

    const displayTitle = FILTER_TITLES[activeKey];
    const hasSelection = isSectionActive(draft, activeKey, config.priceBounds);

    const handleClear = () => {
      onChange(clearSectionFromDraft(draft, activeKey, config.priceBounds));
      onClearSection(activeKey);
    };

    const handleApply = () => {
      onApply();
      sheetRef.current?.close();
    };

    return (
      <BottomSheet
        key={activeKey}
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
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
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: FILTER_SPACING.lg + 4,
              paddingTop: FILTER_SPACING.sm,
              paddingBottom: 14,
              borderBottomWidth: 0.5,
              borderBottomColor: FILTER_COLORS.divider,
            }}>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '600', color: FILTER_COLORS.text }}>
              {displayTitle}
            </Text>
            {hasSelection && (
              <ScaledPressable onPress={handleClear}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: FILTER_COLORS.primary }}>
                  Clear
                </Text>
              </ScaledPressable>
            )}
          </View>

          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: FILTER_SPACING.lg + 4,
              paddingTop: FILTER_SPACING.lg,
              paddingBottom: FILTER_SPACING.sm,
            }}
            showsVerticalScrollIndicator={false}
            bounces={false}
            keyboardShouldPersistTaps="handled">
            <FilterSections
              draft={draft}
              onChange={onChange}
              config={config}
              products={products}
              visibleSections={[activeKey]}
              compact
            />
          </BottomSheetScrollView>

          <FilterFooter
            resultCount={resultCount}
            onReset={handleClear}
            onApply={handleApply}
            applyLabel="Apply"
            safeAreaBottom={false}
          />
        </View>
      </BottomSheet>
    );
  },
);

QuickFilterSheet.displayName = 'QuickFilterSheet';
