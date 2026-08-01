import { forwardRef, useCallback, useImperativeHandle, useMemo, useRef } from 'react';
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
import { countActiveFilters } from '@constants/filterOptions';
import { FILTER_SNAP_POINTS } from '@constants/filterSnapPoints';
import { FILTER_COLORS, FILTER_RADIUS, FILTER_SPACING } from '@constants/filterTokens';
import type { ActiveFilters, CategoryFilterConfig } from '@/types/filter.types';
import type { Product } from '@/types/catalog';

export interface FilterBottomSheetRef {
  open: () => void;
  close: () => void;
}

interface FilterBottomSheetProps {
  draft: ActiveFilters;
  config: CategoryFilterConfig;
  products: Product[];
  resultCount: number;
  onChange: (draft: ActiveFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onClearAll: () => void;
}

export const FilterBottomSheet = forwardRef<FilterBottomSheetRef, FilterBottomSheetProps>(
  (
    { draft, config, products, resultCount, onChange, onApply, onReset, onClearAll },
    ref,
  ) => {
    const sheetRef = useRef<BottomSheet>(null);
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => FILTER_SNAP_POINTS.all, []);

    useImperativeHandle(ref, () => ({
      open: () => sheetRef.current?.snapToIndex(0),
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

    const handleApply = () => {
      onApply();
      sheetRef.current?.close();
    };

    return (
      <BottomSheet
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
              Filters
            </Text>
            {activeDraftCount > 0 && (
              <ScaledPressable onPress={onClearAll}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: FILTER_COLORS.primary }}>
                  Clear All
                </Text>
              </ScaledPressable>
            )}
          </View>

          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: FILTER_SPACING.lg + 4,
              paddingBottom: FILTER_SPACING.lg,
            }}
            showsVerticalScrollIndicator>
            <FilterSections
              draft={draft}
              onChange={onChange}
              config={config}
              products={products}
            />
          </BottomSheetScrollView>

          <FilterFooter
            resultCount={resultCount}
            onReset={onReset}
            onApply={handleApply}
            applyLabel="Apply Filters"
            safeAreaBottom={false}
          />
        </View>
      </BottomSheet>
    );
  },
);

FilterBottomSheet.displayName = 'FilterBottomSheet';
