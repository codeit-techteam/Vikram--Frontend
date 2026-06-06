import { forwardRef, useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import type { StringKey } from '@constants/strings';
import { useTranslation } from '@store/languageStore';
import type { OrderSortOption } from '@utils/sortOrders';

interface OrderSortSheetProps {
  sortOption: OrderSortOption;
  onSelect: (option: OrderSortOption) => void;
}

const SORT_OPTIONS: { id: OrderSortOption; labelKey: StringKey }[] = [
  { id: 'newest', labelKey: 'newestFirst' },
  { id: 'oldest', labelKey: 'oldestFirst' },
  { id: 'price_asc', labelKey: 'priceLowHigh' },
  { id: 'price_desc', labelKey: 'priceHighLow' },
  { id: 'name_asc', labelKey: 'nameAZ' },
];

export const OrderSortSheet = forwardRef<BottomSheet, OrderSortSheetProps>(
  ({ sortOption, onSelect }, ref) => {
    const { t } = useTranslation();
    const snapPoints = useMemo(() => ['42%'], []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    );

    const handleSelect = async (option: OrderSortOption) => {
      await Haptics.selectionAsync();
      onSelect(option);
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}>
        <BottomSheetView className="px-5 pb-8">
          <Text className="mb-4 text-lg font-bold text-text">{t('sortBy')}</Text>

          {SORT_OPTIONS.map((option) => (
            <ScaledPressable
              key={option.id}
              onPress={() => handleSelect(option.id)}
              className="flex-row items-center justify-between border-b border-border py-4">
              <Text
                className={`text-base ${
                  sortOption === option.id ? 'font-bold text-primary' : 'text-text'
                }`}>
                {t(option.labelKey)}
              </Text>
              {sortOption === option.id ? (
                <Ionicons name="checkmark" size={20} color="#FF6B00" />
              ) : null}
            </ScaledPressable>
          ))}
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

OrderSortSheet.displayName = 'OrderSortSheet';
