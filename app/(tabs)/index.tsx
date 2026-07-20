import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@components/AppHeader';
import { SearchBar } from '@components/SearchBar';
import { SearchOverlay } from '@components/SearchOverlay';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import { DrawerMenu } from '@components/DrawerMenu';
import { HeroCarousel } from '@components/HeroCarousel';
import { MembershipCard } from '@components/home/MembershipCard';
import { EmergencyCard } from '@components/home/EmergencyCard';
import { LoyaltyCard } from '@components/home/LoyaltyCard';
import { MaterialCategoryCard } from '@components/home/MaterialCategoryCard';
import { BulkProcurementCard } from '@components/home/BulkProcurementCard';
import { HomeRecommendedSection } from '@components/home/HomeRecommendedSection';
import { TestimonialCarousel } from '@components/home/TestimonialSection';
import { VideoBanner } from '@components/home/VideoBanner';
import { images } from '@constants/images';
import type { StringKey } from '@constants/strings';
import { useTranslation } from '@store/languageStore';
import { drawerPanelStyle, useDrawerAnimation } from '@hooks/useDrawerAnimation';
import { useSearch } from '@hooks/useSearch';

const SECTION_GAP = 24;
const H_PAD = 16;

const CATEGORIES: {
  id: string;
  routeId: string;
  labelKey: StringKey;
  image: number;
}[] = [
  { id: 'cement', routeId: 'cement', labelKey: 'cement', image: images.categoryCement },
  { id: 'hardware', routeId: 'hardware', labelKey: 'hardware', image: images.categoryAggregates },
  { id: 'stone', routeId: 'stone-chips', labelKey: 'stoneChip', image: images.categoryStone },
  { id: 'sand', routeId: 'sand', labelKey: 'sand', image: images.categorySand },
  { id: 'bricks', routeId: 'bricks', labelKey: 'bricksAndMasonry', image: images.categoryBricks },
];

export default function HomeScreen() {
  const { t, language } = useTranslation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSwipeEnabled, setDrawerSwipeEnabled] = useState(true);
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
    drawerSwipeEnabled,
  );

  const handleTestimonialScrollInteraction = useCallback((isInteracting: boolean) => {
    setDrawerSwipeEnabled(!isInteracting);
  }, []);

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

  const onJoinMembership = useCallback(async () => {
    Alert.alert(t('membershipTitle'), t('membershipJoinMock'));
  }, [t]);

  const heroSlides = [
    { badge: t('twoHourDelivery'), title: t('heroBannerTitle'), shopNow: t('shopNow'), bulkInquiry: t('bulkInquiry') },
    { badge: t('twoHourDelivery'), title: t('heroBannerTitle'), shopNow: t('shopNow'), bulkInquiry: t('bulkInquiry') },
    { badge: t('twoHourDelivery'), title: t('heroBannerTitle'), shopNow: t('shopNow'), bulkInquiry: t('bulkInquiry') },
  ];

  const onBulkProcurement = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push('/bulk-procurement' as Href);
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
            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              className="flex-1"
              contentContainerStyle={styles.scrollContent}>
              {/* 1. Header: Logo · Notification · Cart · Search */}
              <AppHeader
                onMenuPress={toggleDrawer}
                isDrawerOpen={drawerOpen}
                menuIconStyle={iconStyle}
              />

              <View style={styles.searchWrap}>
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
              </View>

              {/* 2. Hero Banner Carousel */}
              <View style={styles.section}>
                <HeroCarousel
                  slides={heroSlides}
                  onShopNow={() => router.push('/(tabs)/catalog' as Href)}
                  onBulkInquiry={() => router.push('/bulk-procurement' as Href)}
                />
              </View>

              {/* 3. Loyalty Progress Card */}
              <View style={styles.section}>
                <LoyaltyCard onPress={goLoyalty} />
              </View>

              {/* 4. Material Categories */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('materialCategories')}</Text>
                  <Pressable onPress={onViewAllCategories} hitSlop={12}>
                    <Text style={styles.sectionLink}>{t('viewCat')}</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categoriesRow}>
                  {CATEGORIES.map((cat) => (
                    <MaterialCategoryCard
                      key={cat.id}
                      label={t(cat.labelKey)}
                      image={cat.image}
                      onPress={() => onCategoryPress(cat)}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* 5. Emergency Order Card */}
              <View style={styles.section}>
                <EmergencyCard onOrderNow={goEmergency} />
              </View>

              {/* 6. Promotional Video Banner */}
              <View style={styles.section}>
                <VideoBanner />
              </View>

              {/* 7. Customer Testimonials */}
              <View style={styles.section}>
                <TestimonialCarousel
                  onHorizontalInteractionChange={handleTestimonialScrollInteraction}
                />
              </View>

              {/* 8. Bajriwala Membership ₹299 Card */}
              <View style={styles.section}>
                <MembershipCard onJoin={onJoinMembership} />
              </View>

              {/* 9. Bulk Procurement */}
              <View style={styles.section}>
                <BulkProcurementCard onKnowMore={onBulkProcurement} />
              </View>

              {/* 10. Recommended Products */}
              <HomeRecommendedSection
                onHorizontalInteractionChange={handleTestimonialScrollInteraction}
              />

              <View style={styles.bottomSpacer} />
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
  scrollContent: {
    paddingBottom: 8,
  },
  searchWrap: {
    marginBottom: 0,
  },
  section: {
    marginTop: SECTION_GAP,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FEB623',
  },
  categoriesRow: {
    paddingHorizontal: H_PAD,
    gap: 12,
    paddingBottom: 4,
  },
  bottomSpacer: {
    height: 32,
  },
});
