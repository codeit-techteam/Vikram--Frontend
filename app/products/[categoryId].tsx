import { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@components/AppHeader';
import { ProductCard } from '@components/ProductCard';
import { ScaledPressable } from '@components/ScaledPressable';
import { PRODUCTS_BY_CATEGORY } from '@constants/catalogData';
import { useStrings } from '@hooks/useStrings';

type FilterType = 'grade' | 'eta' | 'brand' | null;

const FILTER_OPTIONS: Record<Exclude<FilterType, null>, string[]> = {
  grade: ['All Grades', 'Grade 53', 'Fe500', 'Fe550', 'Zone 2', 'Class A'],
  eta: ['Any ETA', '90 min', 'Same Day', 'Next Day'],
  brand: ['All Brands', 'UltraTech', 'ACC', 'TATA', 'JSW'],
};

export default function ProductListingScreen() {
  const s = useStrings();
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();

  const [activeFilter, setActiveFilter] = useState<FilterType>('grade');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState('All Grades');

  const products = PRODUCTS_BY_CATEGORY[categoryId ?? '1'] ?? [];
  const title = categoryName ?? 'Products';

  const openFilter = (filter: FilterType) => {
    setActiveFilter(filter);
    setShowFilterModal(true);
  };

  const filters: { key: FilterType; label: string; icon?: string }[] = [
    { key: 'grade', label: 'Grade ▾' },
    { key: 'eta', label: 'ETA ▾' },
    { key: 'brand', label: 'Brand ▾' },
    { key: null, label: 'Filters', icon: 'options-outline' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader showBack title={title} />

      <View className="mx-5 mt-4 flex-row items-center rounded-input border border-border bg-surface px-4 py-3">
        <Ionicons name="search" size={20} color="#FF6B00" />
        <Text className="ml-3 flex-1 text-sm text-text-secondary">{s.searchProducts}</Text>
        <Ionicons name="mic-outline" size={20} color="#FF6B00" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4 px-5"
        contentContainerClassName="gap-2">
        {filters.map((f) => {
          const isActive = activeFilter === f.key && f.key !== null;
          return (
            <ScaledPressable
              key={f.label}
              onPress={() => (f.key ? openFilter(f.key) : setShowFilterModal(true))}
              className={`flex-row items-center rounded-full px-4 py-2 ${
                isActive
                  ? 'bg-primary'
                  : 'border border-border bg-surface'
              }`}>
              {f.icon && (
                <Ionicons
                  name={f.icon as keyof typeof Ionicons.glyphMap}
                  size={14}
                  color={isActive ? '#FFFFFF' : '#666666'}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                className={`text-sm font-semibold ${
                  isActive ? 'text-text-inverse' : 'text-text-secondary'
                }`}>
                {f.label}
              </Text>
            </ScaledPressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
            <ProductCard
              product={item}
              categoryId={categoryId}
              categoryName={categoryName}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <Text className="mt-8 text-center text-text-secondary">No products found.</Text>
        }
      />

      <Modal visible={showFilterModal} transparent animationType="fade">
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setShowFilterModal(false)}>
          <Pressable className="rounded-t-2xl bg-surface p-5" onPress={(e) => e.stopPropagation()}>
            <Text className="mb-4 text-lg font-bold text-text">
              {activeFilter ? `${activeFilter.charAt(0).toUpperCase()}${activeFilter.slice(1)}` : 'Filters'}
            </Text>
            {(activeFilter ? FILTER_OPTIONS[activeFilter] : ['All', 'In Stock', 'Ready for Dispatch']).map(
              (opt) => (
                <ScaledPressable
                  key={opt}
                  onPress={() => {
                    setSelectedOption(opt);
                    setShowFilterModal(false);
                  }}
                  className={`mb-2 rounded-lg px-4 py-3 ${
                    selectedOption === opt ? 'bg-primary/10' : 'bg-background'
                  }`}>
                  <Text
                    className={`text-sm ${
                      selectedOption === opt ? 'font-bold text-primary' : 'text-text'
                    }`}>
                    {opt}
                  </Text>
                </ScaledPressable>
              ),
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
