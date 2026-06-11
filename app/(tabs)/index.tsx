import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  ImageBackground,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedProgressBar } from '@components/AnimatedProgressBar';
import { AppHeader } from '@components/AppHeader';
import { SearchBar } from '@components/SearchBar';
import { SearchOverlay } from '@components/SearchOverlay';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import { DrawerMenu } from '@components/DrawerMenu';
import { HeroCarousel } from '@components/HeroCarousel';
import { LastOrderCard } from '@components/LastOrderCard';
import { getProductById, getProductImageUrl } from '@constants/catalogData';
import { images } from '@constants/images';
import type { StringKey } from '@constants/strings';
import { useTranslation } from '@store/languageStore';
import { drawerPanelStyle, useDrawerAnimation } from '@hooks/useDrawerAnimation';
import { useSearch } from '@hooks/useSearch';
import type { LastOrderedProduct, Order } from '@store/orderStore';
import { useOrderStore } from '@store/orderStore';

const CATEGORIES: {
  id: string;
  routeId: string;
  labelKey: StringKey;
  image: number;
}[] = [
  { id: 'cement', routeId: '1', labelKey: 'cement', image: images.categoryCement },
  { id: 'steel', routeId: '2', labelKey: 'steel', image: images.categorySteel },
  { id: 'stone', routeId: '6', labelKey: 'stoneChip', image: images.categoryStone },
  { id: 'sand', routeId: '3', labelKey: 'sand', image: images.categorySand },
  { id: 'bricks', routeId: '4', labelKey: 'bricksAndMasonry', image: images.categoryBricks },
];

function buildFallbackLastOrders(): LastOrderedProduct[] {
  const steel = getProductById('s2');
  const cement = getProductById('c1');
  const items: LastOrderedProduct[] = [];

  if (steel) {
    items.push({
      id: steel.id,
      name: steel.detailName ?? steel.name,
      description: steel.description,
      image: getProductImageUrl(steel.imageSearch, '80x80'),
      unitPrice: steel.retailPriceValue,
      bulkPrice: steel.bulkPriceValue,
      bulkThreshold: steel.bulkThreshold,
      quantity: 1,
      unit: steel.unit,
      orderedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      orderId: 'fallback',
    });
  }

  if (cement) {
    items.push({
      id: cement.id,
      name: cement.detailName ?? cement.name,
      description: cement.description,
      image: getProductImageUrl(cement.imageSearch, '80x80'),
      unitPrice: cement.retailPriceValue,
      bulkPrice: cement.bulkPriceValue,
      bulkThreshold: cement.bulkThreshold,
      quantity: 1,
      unit: cement.unit,
      orderedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      orderId: 'fallback',
    });
  }

  return items;
}

function CategoryCard({
  label,
  image,
  onPress,
}: {
  label: string;
  image: number;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.93, { damping: 10, stiffness: 300 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1.0, { damping: 10, stiffness: 300 });
        }}
        style={styles.categoryCard}
        hitSlop={4}>
        <View style={styles.categoryImageWrap}>
          <Image source={image} style={styles.categoryImage} contentFit="cover" />
        </View>
        <Text style={styles.categoryLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

function LiveDeliveryCard({ order }: { order: Order }) {
  const { t } = useTranslation();

  const handleCallDriver = async (e: { stopPropagation?: () => void }) => {
    e.stopPropagation?.();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL('tel:+919999999999');
  };

  return (
    <View className="rounded-card bg-surface p-4 shadow-sm">
      <View className="flex-row items-center justify-between">
        <View className="rounded-full bg-success/15 px-3 py-1">
          <Text className="text-[10px] font-bold text-success">{t('enRoute')}</Text>
        </View>
        <Text className="text-xs text-text-secondary">{order.id}</Text>
      </View>
      <Text className="mt-3 text-xl font-bold text-text">{t('deliveryIn')}</Text>
      <Text className="mt-1 text-sm text-text-secondary">{order.quantitySummary}</Text>
      <View className="mt-3">
        <AnimatedProgressBar progress={0.7} height={8} />
      </View>
      <Pressable
        onPress={handleCallDriver}
        hitSlop={12}
        className="mt-3 items-center rounded-lg border border-secondary py-2.5">
        <Text className="text-sm font-semibold text-secondary">{t('callDriver')}</Text>
      </Pressable>
      <View className="mt-3 overflow-hidden rounded-card">
        <Image
          source={{ uri: images.deliveryTruck }}
          style={{ width: '100%', height: 120 }}
          contentFit="cover"
        />
        <View className="absolute bottom-2 left-3 flex-row items-center gap-1.5">
          <Ionicons name="bus-outline" size={14} color="#FFFFFF" />
          <Text className="text-xs font-medium text-text-inverse">{order.vehicleNumber}</Text>
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const { t, language } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screenOpacity = useSharedValue(1);
  const prevLang = useRef(language);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  useEffect(() => {
    if (prevLang.current !== language) {
      screenOpacity.value = withSequence(
        withTiming(0, { duration: 150 }),
        withTiming(1, { duration: 150 }),
      );
      prevLang.current = language;
    }
  }, [language, screenOpacity]);

  const orders = useOrderStore((s) => s.orders);
  const lastOrderedItems = useMemo(
    () => useOrderStore.getState().getLastOrderedProducts(),
    [orders],
  );

  const activeOrder = useMemo(
    () => orders.find((o) => o.status === 'in_transit' || o.status === 'dispatched'),
    [orders],
  );

  const {
    panGesture,
    drawerStyle,
    overlayStyle,
    contentStyle,
    iconStyle,
    openDrawer,
    closeDrawer,
  } = useDrawerAnimation(
    drawerOpen,
    () => setDrawerOpen(true),
    () => setDrawerOpen(false),
  );

  const search = useSearch();

  useEffect(() => {
    if (!drawerOpen) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDrawer();
      return true;
    });
    return () => sub.remove();
  }, [drawerOpen, closeDrawer]);

  useEffect(() => {
    if (!search.isActive) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      search.deactivateSearch();
      return true;
    });
    return () => sub.remove();
  }, [search.isActive, search.deactivateSearch]);

  const toggleDrawer = () => {
    if (drawerOpen) closeDrawer();
    else openDrawer();
  };

  const onCategoryPress = useCallback(
    async (category: (typeof CATEGORIES)[number]) => {
      await Haptics.selectionAsync();
      router.push({
        pathname: '/products/[categoryId]',
        params: { categoryId: category.routeId, categoryName: t(category.labelKey) },
      } as Href);
    },
    [t],
  );

  const onViewAllCategories = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push('/(tabs)/catalog' as Href);
  }, []);

  const goLoyalty = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push('/account/loyalty' as Href);
  }, []);

  const goEmergency = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/emergency-order' as Href);
  }, []);

  const heroSlides = [
    { badge: t('twoHourDelivery'), title: t('heroBannerTitle'), shopNow: t('shopNow'), bulkInquiry: t('bulkInquiry') },
    { badge: t('twoHourDelivery'), title: t('heroBannerTitle'), shopNow: t('shopNow'), bulkInquiry: t('bulkInquiry') },
    { badge: t('twoHourDelivery'), title: t('heroBannerTitle'), shopNow: t('shopNow'), bulkInquiry: t('bulkInquiry') },
  ];

  const displayItems =
    lastOrderedItems.length > 0 ? lastOrderedItems : buildFallbackLastOrders();

  const onViewAllOrders = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push('/(tabs)/orders' as Href);
  }, []);

  const onShopCatalog = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push('/(tabs)/catalog' as Href);
  }, []);

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.root}>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
          pointerEvents={drawerOpen ? 'auto' : 'none'}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        </Animated.View>

        <Animated.View style={[styles.content, contentStyle, fadeStyle]}>
          <SafeAreaView className="flex-1 bg-background" edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <AppHeader
                onMenuPress={toggleDrawer}
                isDrawerOpen={drawerOpen}
                menuIconStyle={iconStyle}
              />

              <View className="px-5">
                <Text className="text-2xl font-bold text-text">{t('goodMorning')}</Text>
                <Text className="mt-0.5 text-sm text-text-secondary">{t('homeSubtitle')}</Text>
              </View>

              <SearchBar
                query={search.query}
                isActive={false}
                onChangeText={search.setQuery}
                onFocus={search.activateSearch}
                onSubmit={() => search.submitSearch()}
                onClear={search.clearQuery}
                onVoicePress={() => {
                  search.deactivateSearch();
                  openVoiceAssistant();
                }}
              />

              <View className="mt-5 px-5">
                <HeroCarousel
                  slides={heroSlides}
                  onShopNow={() => router.push('/(tabs)/catalog' as Href)}
                  onBulkInquiry={() => router.push('/bulk-procurement' as Href)}
                />
              </View>

              <Pressable onPress={goLoyalty} style={styles.loyaltyCard}>
                <View style={styles.loyaltyTopRow}>
                  <View style={styles.tierBadge}>
                    <Text style={styles.tierText}>{t('platinumTier')}</Text>
                  </View>
                  <Text style={styles.pointsText}>12,450 {t('points')}</Text>
                </View>
                <View style={styles.loyaltyMidRow}>
                  <Text style={styles.loyaltyTitle}>{t('loyaltyProgress')}</Text>
                  <Text style={styles.loyaltyNext}>{t('platinumNext')} →</Text>
                </View>
                <AnimatedProgressBar progress={10 / 600} height={5} />
                <Text style={styles.earnText}>{t('earnPoints')}</Text>
              </Pressable>

              <View className="mt-5 flex-row items-center justify-between px-5">
                <Text className="text-base font-bold text-text">{t('materialCategories')}</Text>
                <Pressable onPress={onViewAllCategories} hitSlop={12}>
                  <Text className="text-sm font-semibold text-primary">{t('viewCat')}</Text>
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}>
                {CATEGORIES.map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    label={t(cat.labelKey)}
                    image={cat.image}
                    onPress={() => onCategoryPress(cat)}
                  />
                ))}
              </ScrollView>

              <Pressable onPress={goEmergency} style={styles.emergencyWrap}>
                <ImageBackground
                  source={{ uri: images.emergencyBanner }}
                  style={styles.emergencyBg}
                  imageStyle={{ borderRadius: 16 }}>
                  <View style={styles.emergencyOverlay} />
                  <View style={styles.emergencyContent}>
                    <Text style={styles.emergencyTitle}>{t('criticalShortage')}</Text>
                    <Text style={styles.emergencySubtitle}>{t('criticalSubtitle')}</Text>
                    <View style={styles.emergencyButton}>
                      <Text style={styles.emergencyEmoji}>⚡</Text>
                      <Text style={styles.emergencyButtonText}>{t('emergencyOrder')}</Text>
                    </View>
                  </View>
                </ImageBackground>
              </Pressable>

              {activeOrder ? (
                <Pressable
                  onPress={async () => {
                    await Haptics.selectionAsync();
                    router.push(`/orders/view/${activeOrder.id}` as Href);
                  }}
                  style={styles.liveDeliveryWrap}>
                  <LiveDeliveryCard order={activeOrder} />
                </Pressable>
              ) : null}

              {lastOrderedItems.length === 0 && orders.length === 0 ? (
                <View style={styles.lastOrdersEmpty}>
                  <View style={styles.lastOrdersEmptyIcon}>
                    <Ionicons name="bag-outline" size={22} color="#1A1A1A" />
                  </View>
                  <View style={styles.lastOrdersEmptyText}>
                    <Text style={styles.lastOrdersEmptyTitle}>{t('noLastOrdersPrompt')}</Text>
                    <Text style={styles.lastOrdersEmptySubtitle}>{t('noLastOrdersSubtitle')}</Text>
                  </View>
                  <Pressable onPress={onShopCatalog} style={styles.lastOrdersShopButton}>
                    <Text style={styles.lastOrdersShopText}>{t('shop')}</Text>
                  </Pressable>
                </View>
              ) : displayItems.length > 0 ? (
                <View style={styles.lastOrdersSection}>
                  <View style={styles.lastOrdersHeader}>
                    <View>
                      <Text style={styles.lastOrdersTitle}>{t('lastOrders')}</Text>
                      <Text style={styles.lastOrdersSubtitle}>{t('lastOrdersSubtitle')}</Text>
                    </View>
                    <Pressable
                      onPress={onViewAllOrders}
                      style={styles.lastOrdersViewAll}>
                      <Text style={styles.lastOrdersViewAllText}>{t('viewAll')}</Text>
                      <Ionicons name="chevron-forward" size={14} color="#FEB623" />
                    </Pressable>
                  </View>

                  {displayItems.map((item) => (
                    <LastOrderCard key={item.id} item={item} />
                  ))}
                </View>
              ) : null}

              <Pressable onPress={goLoyalty} className="mx-5 mt-5 mb-8 rounded-card bg-[#1A2332] p-5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-bold tracking-wider text-text-secondary">
                    {t('proStatus')}
                  </Text>
                  <Ionicons name="medal-outline" size={18} color="#FFFFFF" />
                </View>
                <Text className="mt-2 text-3xl font-bold text-text-inverse">{t('points')}</Text>
                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="text-xs text-text-inverse/70">{t('progressToPlatinum')}</Text>
                  <Text className="text-xs font-bold text-text-inverse">85%</Text>
                </View>
                <View className="mt-2">
                  <AnimatedProgressBar progress={0.85} height={5} trackColor="#333" />
                </View>
                <View className="mt-4 items-center rounded-lg border border-white/30 py-3">
                  <Text className="text-sm font-bold text-text-inverse">{t('redeemRewards')}</Text>
                </View>
              </Pressable>
            </ScrollView>

          </SafeAreaView>
        </Animated.View>

        <Animated.View
          style={[drawerPanelStyle.drawer, drawerStyle]}
          pointerEvents={drawerOpen ? 'auto' : 'none'}>
          <DrawerMenu isOpen={drawerOpen} onClose={closeDrawer} />
        </Animated.View>

        {search.isActive ? (
          <SearchOverlay {...search} onClose={search.deactivateSearch} />
        ) : null}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    backgroundColor: '#000000',
    zIndex: 998,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  loyaltyCard: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  loyaltyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tierBadge: {
    borderWidth: 1.5,
    borderColor: '#FEB623',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FEB623',
  },
  pointsText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
  },
  loyaltyMidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  loyaltyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  loyaltyNext: {
    fontSize: 13,
    color: '#FEB623',
    fontWeight: '600',
  },
  earnText: {
    fontSize: 12,
    color: '#FEB623',
    marginTop: 6,
  },
  categoriesRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 12,
    paddingBottom: 8,
  },
  categoryCard: {
    alignItems: 'center',
    width: 80,
  },
  categoryImageWrap: {
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 6,
    textAlign: 'center',
  },
  emergencyWrap: {
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emergencyBg: {
    padding: 20,
    minHeight: 180,
    justifyContent: 'flex-end',
  },
  emergencyOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.60)',
    borderRadius: 16,
  },
  emergencyContent: {
    position: 'relative',
  },
  emergencyTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emergencySubtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 16,
  },
  emergencyButton: {
    backgroundColor: '#FEB623',
    borderRadius: 30,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 4,
    shadowColor: '#FEB623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  emergencyEmoji: {
    fontSize: 16,
  },
  emergencyButtonText: {
    color: '#1A1A1A',
    fontSize: 15,
    fontWeight: '700',
  },
  liveDeliveryWrap: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  lastOrdersSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  lastOrdersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lastOrdersTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  lastOrdersSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  lastOrdersViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  lastOrdersViewAllText: {
    fontSize: 13,
    color: '#FEB623',
    fontWeight: '700',
  },
  lastOrdersEmpty: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#FFF4D1',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FEB623',
    borderStyle: 'dashed',
  },
  lastOrdersEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEB623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastOrdersEmptyText: {
    flex: 1,
  },
  lastOrdersEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  lastOrdersEmptySubtitle: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  lastOrdersShopButton: {
    backgroundColor: '#FEB623',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  lastOrdersShopText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});
