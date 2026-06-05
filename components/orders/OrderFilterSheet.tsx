import { forwardRef, useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

import { ScaledPressable } from '@components/ScaledPressable';
import type { OrderStatus } from '@store/orderStore';

export type StatusFilter = 'all' | OrderStatus | 'active';
export type DateFilter = 'all' | 'today' | 'week' | 'month';

export interface OrderFilters {
  status: StatusFilter;
  date: DateFilter;
}

interface OrderFilterSheetProps {
  filters: OrderFilters;
  onApply: (filters: OrderFilters) => void;
}

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
];

const DATE_OPTIONS: { key: DateFilter; label: string }[] = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
];

export const OrderFilterSheet = forwardRef<BottomSheet, OrderFilterSheetProps>(
  ({ filters, onApply }, ref) => {
    const [local, setLocal] = useState<OrderFilters>(filters);
    const snapPoints = useMemo(() => ['45%'], []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.5} />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}>
        <BottomSheetView className="px-5 pb-8">
          <Text className="mb-4 text-lg font-bold text-text">Filter Orders</Text>

          <Text className="mb-2 text-xs font-bold text-text-secondary">STATUS</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <ScaledPressable
                key={opt.key}
                onPress={() => setLocal((f) => ({ ...f, status: opt.key }))}
                className={`rounded-full px-4 py-2 ${
                  local.status === opt.key ? 'bg-primary' : 'border border-border'
                }`}>
                <Text
                  className={`text-sm font-semibold ${
                    local.status === opt.key ? 'text-text-inverse' : 'text-text-secondary'
                  }`}>
                  {opt.label}
                </Text>
              </ScaledPressable>
            ))}
          </View>

          <Text className="mb-2 text-xs font-bold text-text-secondary">DATE</Text>
          <View className="mb-6 flex-row flex-wrap gap-2">
            {DATE_OPTIONS.map((opt) => (
              <ScaledPressable
                key={opt.key}
                onPress={() => setLocal((f) => ({ ...f, date: opt.key }))}
                className={`rounded-full px-4 py-2 ${
                  local.date === opt.key ? 'bg-primary' : 'border border-border'
                }`}>
                <Text
                  className={`text-sm font-semibold ${
                    local.date === opt.key ? 'text-text-inverse' : 'text-text-secondary'
                  }`}>
                  {opt.label}
                </Text>
              </ScaledPressable>
            ))}
          </View>

          <ScaledPressable
            onPress={() => onApply(local)}
            className="items-center rounded-pill bg-primary py-4">
            <Text className="font-bold text-text-inverse">Apply</Text>
          </ScaledPressable>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

OrderFilterSheet.displayName = 'OrderFilterSheet';
