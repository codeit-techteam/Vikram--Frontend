import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  RefreshControl,
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

import { HomeCollapsibleHeader } from '@components/home/HomeCollapsibleHeader';
import { SearchOverlay } from '@components/SearchOverlay';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import { DrawerMenu } from '@components/DrawerMenu';
import { HeroCarousel } from '@components/HeroCarousel';
import { MembershipBanner } from '@components/membership';
import { EmergencyCard } from '@components/home/EmergencyCard';
import { LoyaltyCard } from '@components/home/LoyaltyCard';
import { MaterialCategoriesGrid } from '@components/home/MaterialCategoriesGrid';
import { BulkProcurementCard } from '@components/home/BulkProcurementCard';
import { BrandAdsSection } from '@components/home/BrandAdsSection';
import { HomeProductDiscovery } from '@components/home/HomeProductDiscovery';
import { TestimonialCarousel } from '@components/home/TestimonialSection';
import { VideoBanner } from '@components/home/VideoBanner';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { HomeCategoriesSkeleton } from '@components/catalog/CatalogSkeletons';
import { useCategories } from '@hooks/useCategories';
import { useCmsHome } from '@hooks/useCmsHome';
import { useHomeCatalog } from '@hooks/useHome';
import { useHomeProducts } from '@hooks/useHomeProducts';
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

  const { isRefreshing: catalogRefreshing, refresh: refreshCatalog } =
    useHomeCatalog();

  const {
    categories: homeCategories,
    isLoading: categoriesLoading,
    isRefreshing: categoriesRefreshing,
    error: categoriesError,
    refresh: refreshCategories,
  } = useCategories();

  const {
    sections,
    banners,
    videoBanners,
    ads,
    testimonials,
    emergencyDelivery,
    bulkProcurement,
    isRefreshing: cmsRefreshing,
    refresh: refreshCms,
  } = useCmsHome();

  const { isRefreshing: productsRefreshing, refresh: refreshHomeProducts } =
    useHomeProducts();

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
        params: {
          categoryId: category.id,
          categorySlug: category.slug,
          categoryName: name,
        },
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

  const onOpenMembership = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/membership' as Href);
  }, []);

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
    await Promise.all([
      refreshCatalog(),
      refreshCategories(),
      refreshCms(),
      refreshHomeProducts(),
    ]);
  }, [refreshCatalog, refreshCategories, refreshCms, refreshHomeProducts]);

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

      case 'MATERIAL_CATEGORIES': {
        if (categoriesLoading && homeCategories.length === 0) {
          return (
            <View key={sectionType} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {sectionMeta(sectionType)?.title ?? t('materialCategories')}
                </Text>
                <Pressable onPress={onViewAllCategories} hitSlop={12}>
                  <Text style={styles.sectionLink}>{t('viewCat')} ›</Text>
                </Pressable>
              </View>
              <HomeCategoriesSkeleton />
            </View>
          );
        }

        if (categoriesError && homeCategories.length === 0) {
          return (
            <View key={sectionType} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {sectionMeta(sectionType)?.title ?? t('materialCategories')}
                </Text>
                <Pressable onPress={onViewAllCategories} hitSlop={12}>
                  <Text style={styles.sectionLink}>{t('viewCat')} ›</Text>
                </Pressable>
              </View>
              <CatalogErrorState
                message={t('unableToLoadCategories')}
                onRetry={() => void refreshCategories()}
              />
            </View>
          );
        }

        // Empty state: hide the entire section
        if (homeCategories.length === 0) return null;

        return (
          <View key={sectionType} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {sectionMeta(sectionType)?.title ?? t('materialCategories')}
              </Text>
              <Pressable onPress={onViewAllCategories} hitSlop={12}>
                <Text style={styles.sectionLink}>{t('viewCat')} ›</Text>
              </Pressable>
            </View>
            <MaterialCategoriesGrid
              categories={homeCategories}
              language={language}
              onCategoryPress={(cat) => void onCategoryPress(cat)}
            />
          </View>
        );
      }

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
        // Compact MembershipBanner is fixed below Search; skip CMS card to avoid duplicate.
        return null;

      case 'BULK_PROCUREMENT':
        return (
          <View key={sectionType} style={styles.section}>
            <BulkProcurementCard
              onKnowMore={onBulkProcurement}
              promotion={bulkProcurement}
            />
          </View>
        );

      case 'PRODUCT_DISCOVERY':
        return <HomeProductDiscovery key={sectionType} />;

      case 'RECOMMENDED':
        // Replaced by PRODUCT_DISCOVERY (Featured / Popular / New / Deals)
        return null;

      case 'PRIORITY_EXPRESS':
        return null;

      default:
        return null;
    }
  };

  // Fallback order when CMS sections are empty (before seed/migration)
  // Desired flow: Hero → Loyalty → Categories → Product Discovery → Ads → Testimonials
  const sectionOrder = useMemo(() => {
    const base =
      enabledSections.length > 0
        ? enabledSections
            .map((s) => s.sectionType)
            .filter((type) => type !== 'RECOMMENDED')
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
          ];

    if (base.includes('PRODUCT_DISCOVERY')) return base;

    const withDiscovery: string[] = [];
    let inserted = false;
    for (const type of base) {
      withDiscovery.push(type);
      if (type === 'MATERIAL_CATEGORIES') {
        withDiscovery.push('PRODUCT_DISCOVERY');
        inserted = true;
      }
    }
    if (!inserted) {
      const adsIdx = withDiscovery.indexOf('ADVERTISEMENTS');
      const testimonialsIdx = withDiscovery.indexOf('TESTIMONIALS');
      const insertAt =
        adsIdx >= 0
          ? adsIdx
          : testimonialsIdx >= 0
            ? testimonialsIdx
            : withDiscovery.length;
      withDiscovery.splice(insertAt, 0, 'PRODUCT_DISCOVERY');
    }
    return withDiscovery;
  }, [enabledSections]);

  return (
    <View style={styles.root}>
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        pointerEvents={drawerOpen ? 'auto' : 'none'}
        collapsable={false}>
        {drawerOpen ? (
          <Pressable style={StyleSheet.absoluteFill} onPress={closeDrawer} />
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.content, contentStyle, fadeStyle]}>
        <View style={styles.screen}>
          <HomeCollapsibleHeader
            scrollY={homeScrollY}
            onMenuPress={toggleDrawer}
            isDrawerOpen={drawerOpen}
            menuIconStyle={iconStyle}
            searchQuery={search.query}
            onSearchChange={search.setQuery}
            onSearchFocus={search.activateSearch}
            onSearchSubmit={() => search.submitSearch()}
            onSearchClear={search.clearQuery}
            onVoicePress={() => {
              search.deactivateSearch();
              openVoiceAssistant();
            }}
          />

          <GestureDetector gesture={panGesture}>
            <View style={styles.scrollGestureWrap}>
            <Animated.ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              onScroll={onHomeScroll}
              scrollEventThrottle={16}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={
                    catalogRefreshing ||
                    categoriesRefreshing ||
                    cmsRefreshing ||
                    productsRefreshing
                  }
                  onRefresh={() => void onRefresh()}
                />
              }>
              <MembershipBanner onPress={onOpenMembership} />

              {sectionOrder.map((type) => renderSection(type))}

              <View style={styles.bottomSpacer} />
            </Animated.ScrollView>
            </View>
          </GestureDetector>
        </View>
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
  screen: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scroll: {
    flex: 1,
  },
  scrollGestureWrap: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
    paddingTop: 8,
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
  bottomSpacer: {
    height: 32,
  },
});
