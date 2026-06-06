import { useCallback, useMemo, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ProductCard } from '@components/ProductCard';
import { ScaledPressable } from '@components/ScaledPressable';
import { searchProductToProduct } from '@constants/searchData';
import type { SearchProduct } from '@constants/searchData';
import { useTranslation } from '@store/languageStore';
import type { SearchSortOption } from '@utils/searchUtils';

const RESULT_CARD_HEIGHT = 520;

const SORT_OPTIONS: { id: SearchSortOption; labelKey: 'relevance' | 'priceLowHigh' | 'priceHighLow' | 'newestFirst' }[] = [
  { id: 'relevance', labelKey: 'relevance' },
  { id: 'price_asc', labelKey: 'priceLowHigh' },
  { id: 'price_desc', labelKey: 'priceHighLow' },
  { id: 'newest', labelKey: 'newestFirst' },
];

interface SearchResultsProps {
  query: string;
  results: SearchProduct[];
  sortOption: SearchSortOption;
  onSortChange: (option: SearchSortOption) => void;
}

export function SearchResults({
  query,
  results,
  sortOption,
  onSortChange,
}: SearchResultsProps) {
  const { t } = useTranslation();
  const sortSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['38%'], []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.4} />
    ),
    [],
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: RESULT_CARD_HEIGHT,
      offset: RESULT_CARD_HEIGHT * index,
      index,
    }),
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: SearchProduct }) => {
      const product = searchProductToProduct(item);
      return (
        <View style={styles.cardWrap}>
          <ProductCard
            product={product}
            categoryName={item.category}
            highlightQuery={query}
          />
        </View>
      );
    },
    [query],
  );

  const openSort = async () => {
    await Haptics.selectionAsync();
    sortSheetRef.current?.expand();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.count}>
          {results.length} {t('resultsFor')} &apos;{query}&apos;
        </Text>
        <View style={styles.actions}>
          <ScaledPressable style={styles.actionBtn} onPress={() => undefined}>
            <Ionicons name="options-outline" size={14} color="#666" />
            <Text style={styles.actionText}>{t('filter')}</Text>
          </ScaledPressable>
          <ScaledPressable style={styles.actionBtn} onPress={openSort}>
            <Ionicons name="swap-vertical" size={14} color="#666" />
            <Text style={styles.actionText}>{t('sort')}</Text>
          </ScaledPressable>
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={4}
        maxToRenderPerBatch={6}
        windowSize={5}
      />

      <BottomSheet
        ref={sortSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}>
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>{t('sortBy')}</Text>
          {SORT_OPTIONS.map((option) => (
            <Pressable
              key={option.id}
              style={styles.sortRow}
              onPress={async () => {
                await Haptics.selectionAsync();
                onSortChange(option.id);
                sortSheetRef.current?.close();
              }}>
              <Text
                style={[
                  styles.sortLabel,
                  sortOption === option.id && styles.sortLabelActive,
                ]}>
                {t(option.labelKey)}
              </Text>
              {sortOption === option.id ? (
                <Ionicons name="checkmark" size={18} color="#FF6A00" />
              ) : null}
            </Pressable>
          ))}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  count: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  cardWrap: {
    marginBottom: 4,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  sortLabel: {
    fontSize: 15,
    color: '#1A1A1A',
  },
  sortLabelActive: {
    fontWeight: '700',
    color: '#FF6A00',
  },
});
