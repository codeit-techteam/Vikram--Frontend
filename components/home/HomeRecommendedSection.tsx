import { useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';

import { RecommendedProductCard } from '@components/home/RecommendedProductCard';
import { getRecommendedProducts, type RecommendedProduct } from '@constants/recommendedData';
import { useCarouselDrawerLock } from '@hooks/useCarouselDrawerLock';
import { useTranslation } from '@store/languageStore';

const H_PAD = 16;
const CARD_GAP = 14;
const CARD_WIDTH_RATIO = 0.76;
const MAX_CARD_WIDTH = 320;

interface HomeRecommendedSectionProps {
  onHorizontalInteractionChange?: (isInteracting: boolean) => void;
}

export function HomeRecommendedSection({
  onHorizontalInteractionChange,
}: HomeRecommendedSectionProps) {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const scrollLock = useCarouselDrawerLock(onHorizontalInteractionChange);

  const cardWidth = Math.min(screenWidth * CARD_WIDTH_RATIO, MAX_CARD_WIDTH);
  const snapInterval = cardWidth + CARD_GAP;

  const products = useMemo(() => getRecommendedProducts(6), []);

  const onViewAll = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push('/(tabs)/catalog' as Href);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: RecommendedProduct }) => (
      <RecommendedProductCard product={item} width={cardWidth} />
    ),
    [cardWidth],
  );

  const keyExtractor = useCallback((item: RecommendedProduct) => item.id, []);

  const ItemSeparator = useCallback(() => <View style={{ width: CARD_GAP }} />, []);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{t('recommendedForYou')}</Text>
          <Text style={styles.subtitle}>{t('recommendedSubtitle')}</Text>
        </View>
        <Pressable onPress={() => void onViewAll()} hitSlop={10} style={styles.viewAll}>
          <Text style={styles.viewAllText}>{t('viewAll')}</Text>
          <Ionicons name="arrow-forward" size={12} color="#FEB623" />
        </Pressable>
      </View>

      <FlatList
        data={products}
        horizontal
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={[
          styles.listContent,
          { paddingRight: H_PAD },
        ]}
        {...scrollLock}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    marginBottom: 14,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
    lineHeight: 16,
  },
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FEB623',
  },
  listContent: {
    paddingLeft: H_PAD,
    paddingBottom: 6,
  },
});
