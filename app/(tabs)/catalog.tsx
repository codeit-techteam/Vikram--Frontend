import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@components/AppHeader';
import { DrawerShell } from '@components/DrawerShell';
import { CategoryCard } from '@components/CategoryCard';
import { ScaledPressable } from '@components/ScaledPressable';
import { CATALOG_CATEGORIES } from '@constants/catalogData';
import { useStrings } from '@hooks/useStrings';

export default function CatalogScreen() {
  const s = useStrings();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rows: (typeof CATALOG_CATEGORIES)[] = [];
  for (let i = 0; i < CATALOG_CATEGORIES.length; i += 2) {
    rows.push(CATALOG_CATEGORIES.slice(i, i + 2));
  }

  const navigateToCategory = (id: string, name: string) => {
    router.push({
      pathname: '/products/[categoryId]',
      params: { categoryId: id, categoryName: name },
    } as Href);
  };

  return (
    <DrawerShell
      isOpen={drawerOpen}
      onOpen={() => setDrawerOpen(true)}
      onClose={() => setDrawerOpen(false)}>
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader onMenuPress={() => setDrawerOpen(true)} />
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

        <View className="px-5 pb-2">
          <Text className="text-2xl font-bold text-text">{s.precisionProcurement}</Text>
          <Text className="mt-2 text-sm leading-5 text-text-secondary">
            {s.precisionProcurementDesc}
          </Text>
        </View>

        <View className="mt-4 px-5">
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row gap-3">
              {row.map((cat) => (
                <CategoryCard
                  key={cat.id}
                  name={cat.name}
                  image={cat.image}
                  onPress={() => navigateToCategory(cat.id, cat.name)}
                />
              ))}
              {row.length === 1 && <View className="flex-1" />}
            </View>
          ))}
        </View>

        <View className="mx-5 mt-6 rounded-card bg-primary p-5">
          <Text className="text-lg font-bold text-text-inverse">{s.bulkProcurementTitle}</Text>
          <Text className="mt-2 text-sm leading-5 text-text-inverse/90">
            {s.bulkProcurementDesc}
          </Text>
          <ScaledPressable className="mt-4 self-center rounded-pill border-2 border-surface bg-surface px-8 py-2.5">
            <Text className="text-sm font-bold text-primary">{s.inquireNow}</Text>
          </ScaledPressable>
        </View>

        <View className="mx-5 mt-5 mb-8 items-center rounded-card bg-trust p-6">
          <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-surface">
            <Ionicons name="bus-outline" size={24} color="#FF6B00" />
          </View>
          <Text className="text-base font-bold text-text">{s.priorityExpress}</Text>
          <Text className="mt-2 text-center text-sm text-text-secondary">
            {s.priorityExpressDesc}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </DrawerShell>
  );
}
