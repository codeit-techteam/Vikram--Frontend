import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@components/AppHeader';
import { HomeHeaderCard } from '@components/home/HomeHeaderCard';
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
import { BrandAdsSection } from '@components/home/BrandAdsSection';
import { HomeRecommendedSection } from '@components/home/HomeRecommendedSection';
import { TestimonialCarousel } from '@components/home/TestimonialSection';
import { VideoBanner } from '@components/home/VideoBanner';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { HomeCategoriesSkeleton } from '@components/catalog/CatalogSkeletons';
import { useCmsHome } from '@hooks/useCmsHome';
import { useHomeCatalog } from '@hooks/useHome';
import { useSites } from '@hooks/useSites';
import { useTranslation } from '@store/languageStore';
import { useAuthStore } from '@store/useAuthStore';
import { drawerPanelStyle, useDrawerAnimation } from '@hooks/useDrawerAnimation';
import { useSearch } from '@hooks/useSearch';
import { requireAuth } from '@utils/requireAuth';
import { customerHasDeliverySites } from '@utils/ensureDeliverySite';
import type { CatalogCategory } from '@/types/catalog';
import {
  adaptHeroSlides,
  adaptTestimonialReviews,
  adaptTestimonialVideos,
  navigateBannerPrimary,
  navigateCmsRedirect,
  navigatePromotion,
} from '@utils/cmsAdapters';

const SECTION_GAP = 24;
const H_PAD = 16;

function pickHomeCategories(
  top: CatalogCategory[],
  featured: CatalogCategory[],
): CatalogCategory[] {
  const source = top.length > 0 ? top : featured;
  return source.slice(0, 8);
}

export default function HomeScreen() {
  const { t, language } = useTranslation();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  useSites(isLoggedIn);
  const homeScrollY = useSharedValue(0);
  const onHomeScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      homeScrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    void customerHasDeliverySites().then((hasSites) => {
      if (!hasSites) {
        router.replace('/delivery-location' as Href);
      }
    });
  }, [isLoggedIn]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSwipeEnabled, setDrawerSwipeEnabled] = useState(true);
  const screenOpacity = useSharedValue(1);
  const prevLang = useRef(language);

  const {
    topCategories,
    featuredCategories,
    isLoading: homeLoading,
    isRefreshing: catalogRefreshing,
    error: homeError,
    refresh: refreshCatalog,
  } = useHomeCatalog();

  const {
    sections,
    banners,
    videoBanners,
    ads,
    testimonials,
    emergencyDelivery,
    bulkProcurement,
    membership,
    isRefreshing: cmsRefreshing,
    refresh: refreshCms,
  } = useCmsHome();

  const homeCategories = pickHomeCategories(topCategories, featuredCategories);

  const heroSlides = useMemo(() => adaptHeroSlides(banners), [banners]);
  const testimonialVideos = useMemo(
    () => adaptTestimonialVideos(testimonials),
    [testimonials],
  );
  const testimonialReviews = useMemo(
    () => adaptTestimonialReviews(testimonials),
    [testimonials],
  );
  const videoBanner = videoBanners[0] ?? null;

  const enabledSections = useMemo(
    () =>
      [...sections]
        .filter((s) => s.enabled)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [sections],
  );

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
    async (category: CatalogCategory) => {
      await Haptics.selectionAsync();
      const name =
        language === 'hi' && category.nameHi ? category.nameHi : category.name;
      router.push({
        pathname: '/products/[categoryId]',
        params: { categoryId: category.slug, categoryName: name },
      } as Href);
    },
    [language],
  );

  const onViewAllCategories = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push('/(tabs)/catalog' as Href);
  }, []);

  const goLoyalty = useCallback(async () => {
    await Haptics.selectionAsync();
    if (!requireAuth('Please log in to view loyalty wallet.')) return;
    router.push('/account/loyalty' as Href);
  }, []);

  const goEmergency = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!requireAuth('Please log in for emergency orders.')) return;
    if (emergencyDelivery?.redirectId) {
      navigatePromotion(emergencyDelivery);
      return;
    }
    router.push('/emergency-order' as Href);
  }, [emergencyDelivery]);

  const onJoinMembership = useCallback(async () => {
    if (!requireAuth('Please log in to join membership.')) return;
    if (membership?.redirectId) {
      navigatePromotion(membership);
      return;
    }
    Alert.alert(membership?.title ?? t('membershipTitle'), t('membershipJoinMock'));
  }, [membership, t]);

  const onBulkProcurement = useCallback(async () => {
    await Haptics.selectionAsync();
    if (!requireAuth('Please log in for bulk procurement.')) return;
    if (bulkProcurement?.redirectId) {
      navigatePromotion(bulkProcurement);
      return;
    }
    router.push('/bulk-procurement' as Href);
  }, [bulkProcurement]);

  const onVideoShopNow = useCallback(() => {
    if (videoBanner) {
      navigateBannerPrimary(videoBanner);
      return;
    }
    router.push('/(tabs)/catalog' as Href);
  }, [videoBanner]);

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshCatalog(), refreshCms()]);
  }, [refreshCatalog, refreshCms]);

  const sectionMeta = (type: string) =>
    enabledSections.find((s) => s.sectionType === type);

  const renderSection = (sectionType: string) => {
    switch (sectionType) {
      case 'HERO_BANNER':
        return heroSlides.length > 0 ? (
          <View key={sectionType} style={styles.section}>
            <HeroCarousel
              slides={heroSlides}
              onShopNow={(slide) => {
                if (slide.linkTarget) {
                  navigateCmsRedirect('ROUTE', slide.linkTarget);
                } else {
                  router.push('/(tabs)/catalog' as Href);
                }
              }}
              onBulkInquiry={(slide) => {
                if (slide.secondaryLinkTarget) {
                  navigateCmsRedirect('ROUTE', slide.secondaryLinkTarget);
                } else {
                  router.push('/bulk-procurement' as Href);
                }
              }}
            />
          </View>
        ) : null;

      case 'LOYALTY':
        return (
          <View key={sectionType} style={styles.section}>
            <LoyaltyCard onPress={goLoyalty} />
          </View>
        );

      case 'MATERIAL_CATEGORIES':
        return (
          <View key={sectionType} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {sectionMeta(sectionType)?.title ?? t('materialCategories')}
              </Text>
              <Pressable onPress={onViewAllCategories} hitSlop={12}>
                <Text style={styles.sectionLink}>{t('viewCat')}</Text>
              </Pressable>
            </View>
            {homeLoading && homeCategories.length === 0 ? (
              <HomeCategoriesSkeleton />
            ) : homeError && homeCategories.length === 0 ? (
              <CatalogErrorState
                message={t('unableToLoadCategories')}
                onRetry={() => void refreshCatalog()}
              />
            ) : homeCategories.length === 0 ? (
              <Text style={styles.emptyCategories}>{t('unableToLoadCategories')}</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesRow}>
                {homeCategories.map((cat) => (
                  <MaterialCategoryCard
                    key={cat.id}
                    label={
                      language === 'hi' && cat.nameHi ? cat.nameHi : cat.name
                    }
                    image={cat.image as number | { uri: string }}
                    onPress={() => void onCategoryPress(cat)}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        );

      case 'EMERGENCY_DELIVERY':
        return (
          <View key={sectionType} style={styles.section}>
            <EmergencyCard
              onOrderNow={goEmergency}
              promotion={emergencyDelivery}
            />
          </View>
        );

      case 'VIDEO_BANNER':
        return (
          <View key={sectionType} style={styles.section}>
            <VideoBanner banner={videoBanner} onShopNow={onVideoShopNow} />
          </View>
        );

      case 'ADVERTISEMENTS':
        return ads.length > 0 ? (
          <View key={sectionType} style={styles.section}>
            <BrandAdsSection
              ads={ads}
              title={sectionMeta(sectionType)?.title}
            />
          </View>
        ) : null;

      case 'TESTIMONIALS':
        return (
          <View key={sectionType} style={styles.section}>
            <TestimonialCarousel
              videos={testimonialVideos}
              reviews={testimonialReviews}
              title={sectionMeta(sectionType)?.title}
              subtitle={sectionMeta(sectionType)?.subtitle}
              onHorizontalInteractionChange={handleTestimonialScrollInteraction}
            />
          </View>
        );

      case 'MEMBERSHIP':
        return (
          <View key={sectionType} style={styles.section}>
            <MembershipCard onJoin={onJoinMembership} promotion={membership} />
          </View>
        );

      case 'BULK_PROCUREMENT':
        return (
          <View key={sectionType} style={styles.section}>
            <BulkProcurementCard
              onKnowMore={onBulkProcurement}
              promotion={bulkProcurement}
            />
          </View>
        );

      case 'RECOMMENDED':
        return (
          <HomeRecommendedSection
            key={sectionType}
            onHorizontalInteractionChange={handleTestimonialScrollInteraction}
          />
        );

      case 'PRIORITY_EXPRESS':
        return null;

      default:
        return null;
    }
  };

  // Fallback order when CMS sections are empty (before seed/migration)
  const sectionOrder =
    enabledSections.length > 0
      ? enabledSections.map((s) => s.sectionType)
      : [
          'HERO_BANNER',
          'LOYALTY',
          'MATERIAL_CATEGORIES',
          'EMERGENCY_DELIVERY',
          'VIDEO_BANNER',
          'ADVERTISEMENTS',
          'TESTIMONIALS',
          'MEMBERSHIP',
          'BULK_PROCUREMENT',
          'RECOMMENDED',
        ];

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
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              className="flex-1"
              contentContainerStyle={styles.scrollContent}
              onScroll={onHomeScroll}
              scrollEventThrottle={16}
              refreshControl={
                <RefreshControl
                  refreshing={catalogRefreshing || cmsRefreshing}
                  onRefresh={() => void onRefresh()}
                />
              }>
              <AppHeader
                onMenuPress={toggleDrawer}
                isDrawerOpen={drawerOpen}
                menuIconStyle={iconStyle}
              />
              <HomeHeaderCard scrollY={homeScrollY} />

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

              {sectionOrder.map((type) => renderSection(type))}

              <View style={styles.bottomSpacer} />
            </Animated.ScrollView>
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
  emptyCategories: {
    paddingHorizontal: H_PAD,
    color: '#888888',
    fontSize: 13,
  },
  bottomSpacer: {
    height: 32,
  },
});
