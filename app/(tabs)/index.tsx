import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BackHandler,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect, type Href } from 'expo-router';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
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
import { SitesPickerSheet } from '@components/checkout/SitesPickerSheet';
import { SearchOverlay } from '@components/SearchOverlay';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';
import { DrawerMenu } from '@components/DrawerMenu';
import { HeroCarousel } from '@components/HeroCarousel';
import { MaterialCategoriesGrid } from '@components/home/MaterialCategoriesGrid';
import { BulkProcurementCard } from '@components/home/BulkProcurementCard';
import { BrandAdsSection } from '@components/home/BrandAdsSection';
import { OfferForYouSection, OfferForYouSkeleton } from '@components/home/OfferForYouSection';
import { QuickActionsRow } from '@components/home/QuickActionsRow';
import { HomeProductDiscovery } from '@components/home/HomeProductDiscovery';
import { HomeProductSection } from '@components/home/HomeProductSection';
import {
  HomePromoBanners,
  HomePromoBannerSkeleton,
} from '@components/home/HomePromoBanners';
import { DeliveryPromotionBanner } from '@components/home/DeliveryPromotionBanner';
import { TestimonialCarousel } from '@components/home/TestimonialSection';
import { VideoBanner } from '@components/home/VideoBanner';
import { CatalogErrorState } from '@components/catalog/CatalogErrorState';
import { HomeCategoriesSkeleton } from '@components/catalog/CatalogSkeletons';
import { useCategories } from '@hooks/useCategories';
import { useCmsHome } from '@hooks/useCmsHome';
import { useDeliveryPromotions } from '@hooks/useDeliveryPromotions';
import { useHomeCatalog } from '@hooks/useHome';
import { useHomeProducts } from '@hooks/useHomeProducts';
import { useSites } from '@hooks/useSites';
import { useTranslation } from '@store/languageStore';
import { useAuthStore } from '@store/useAuthStore';
import { useLoyaltyStore } from '@store/loyaltyStore';
import { drawerPanelStyle, useDrawerAnimation } from '@hooks/useDrawerAnimation';
import { useSearch } from '@hooks/useSearch';
import { requireAuth } from '@utils/requireAuth';
import { customerHasDeliverySites } from '@utils/ensureDeliverySite';
import type { CatalogCategory } from '@/types/catalog';
import {
  filterMarketplaceCategories,
  getCategoryDisplayName,
  sortHomeCategories,
} from '@utils/categoryDisplay';
import {
  adaptCmsCategories,
  adaptHeroSlides,
  adaptPromoSlides,
  adaptTestimonialReviews,
  adaptTestimonialVideos,
  navigateBannerPrimary,
  navigateCmsRedirect,
} from '@utils/cmsAdapters';
import { isPromoBannerEligible } from '@utils/bannerAudience';

const SECTION_GAP = 24;
/** Tighter gap when adjacent CMS banner sections sit next to each other. */
const TOP_CLUSTER_GAP = 12;
const TOP_CLUSTER = new Set([
  'DELIVERY_PROMOTION',
  'PROMO_BANNER',
  'HOME_PROMO',
  'HERO_BANNER',
]);
const H_PAD = 16;

export default function HomeScreen() {
  const { t, language } = useTranslation();
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const freeBikeRemaining = useLoyaltyStore((s) => s.freeBikeDeliveriesRemaining);
  const freeBikeUsed = useLoyaltyStore((s) => s.freeBikeDeliveriesUsed);
  const refreshLoyalty = useLoyaltyStore((s) => s.refresh);
  useSites(isLoggedIn);
  const homeScrollY = useSharedValue(0);
  const sitesSheetRef = useRef<BottomSheetModal>(null);
  const closeDeliverySites = useCallback(() => {
    sitesSheetRef.current?.dismiss();
  }, []);
  const openDeliverySites = useCallback(() => {
    requestAnimationFrame(() => {
      if (sitesSheetRef.current) {
        sitesSheetRef.current.present();
        return;
      }
      router.push('/delivery-location' as Href);
    });
  }, []);
  const onHomeScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      homeScrollY.value = event.contentOffset.y;
    },
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    void refreshLoyalty();
  }, [isLoggedIn, refreshLoyalty]);

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
    categories: rawHomeCategories,
    isLoading: categoriesLoading,
    isRefreshing: categoriesRefreshing,
    error: categoriesError,
    refresh: refreshCategories,
  } = useCategories();

  const {
    sections,
    banners,
    heroBanners,
    promoBanners,
    videoBanners,
    heroVideo,
    ads,
    testimonials,
    offers,
    quickActions,
    bulkProcurement,
    categories: cmsCategories,
    isLoading: cmsLoading,
    isRefreshing: cmsRefreshing,
    error: cmsError,
    refresh: refreshCms,
  } = useCmsHome();

  const {
    featured: deliveryPromotion,
    isLoading: deliveryPromoLoading,
    refresh: refreshDeliveryPromotions,
  } = useDeliveryPromotions();

  useFocusEffect(
    useCallback(() => {
      void refreshCms();
      void refreshDeliveryPromotions();
    }, [refreshCms, refreshDeliveryPromotions]),
  );

  const {
    featured: featuredProducts,
    offers: topDealProducts,
    recentlyAdded: recentlyAddedProducts,
    isLoading: homeProductsLoading,
    isRefreshing: productsRefreshing,
    refresh: refreshHomeProducts,
  } = useHomeProducts();

  const heroSlides = useMemo(
    () => adaptHeroSlides(heroBanners.length > 0 ? heroBanners : banners),
    [heroBanners, banners],
  );
  const promoAudience = useMemo(
    () => ({ isLoggedIn, freeBikeRemaining, freeBikeUsed }),
    [isLoggedIn, freeBikeRemaining, freeBikeUsed],
  );
  const promoSlides = useMemo(() => {
    return adaptPromoSlides(promoBanners).filter((slide) =>
      isPromoBannerEligible(slide.targetAudience, promoAudience),
    );
  }, [promoBanners, promoAudience]);
  const testimonialVideos = useMemo(
    () => adaptTestimonialVideos(testimonials),
    [testimonials],
  );
  const testimonialReviews = useMemo(
    () => adaptTestimonialReviews(testimonials),
    [testimonials],
  );
  const videoBanner = heroVideo ?? videoBanners[0] ?? null;

  const homeCategories = useMemo(() => {
    if (cmsCategories.length > 0) {
      return sortHomeCategories(
        filterMarketplaceCategories(adaptCmsCategories(cmsCategories)),
      );
    }
    return sortHomeCategories(filterMarketplaceCategories(rawHomeCategories));
  }, [cmsCategories, rawHomeCategories]);

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

  const toggleDrawer = () => {
    if (drawerOpen) closeDrawer();
    else openDrawer();
  };

  const onCategoryPress = useCallback(
    async (category: CatalogCategory) => {
      await Haptics.selectionAsync();
      const name = getCategoryDisplayName(category, language, t);
      router.push({
        pathname: '/products/[categoryId]',
        params: {
          categoryId: category.id,
          categorySlug: category.slug,
          categoryName: name,
        },
      } as Href);
    },
    [language, t],
  );

  const onViewAllCategories = useCallback(async () => {
    await Haptics.selectionAsync();
    router.push('/(tabs)/catalog' as Href);
  }, []);

  const onBulkProcurement = useCallback(async () => {
    await Haptics.selectionAsync();
    if (!requireAuth('Please log in for bulk procurement.')) return;
    router.push('/bulk-procurement/enquiry' as Href);
  }, []);

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
      refreshDeliveryPromotions(),
    ]);
  }, [
    refreshCatalog,
    refreshCategories,
    refreshCms,
    refreshHomeProducts,
    refreshDeliveryPromotions,
  ]);

  const sectionMeta = (type: string) =>
    enabledSections.find((s) => s.sectionType === type);

  // Follow Super Admin Homepage Layout order (displayOrder / enabled).
  const sectionOrder = useMemo(
    () => enabledSections.map((s) => s.sectionType),
    [enabledSections],
  );

  const hasDeliveryPromo =
    Boolean(deliveryPromotion?.bannerImage) || deliveryPromoLoading;

  const sectionWrapStyle = (sectionType: string, index: number) => {
    if (index === 0 && !hasDeliveryPromo) return styles.sectionFlush;
    if (index === 0 && hasDeliveryPromo) return styles.sectionTight;
    const prev = sectionOrder[index - 1];
    if (TOP_CLUSTER.has(sectionType) && TOP_CLUSTER.has(prev)) {
      return styles.sectionTight;
    }
    return styles.section;
  };

  const renderSection = (sectionType: string, index: number) => {
    const wrap = sectionWrapStyle(sectionType, index);

    switch (sectionType) {
      case 'HERO_BANNER':
        return heroSlides.length > 0 ? (
          <View key={sectionType} style={wrap}>
            <HeroCarousel
              slides={heroSlides}
              onShopNow={(slide) => {
                if (slide.linkTarget) {
                  navigateCmsRedirect(
                    slide.linkType ?? 'ROUTE',
                    slide.linkTarget,
                  );
                } else {
                  router.push('/(tabs)/catalog' as Href);
                }
              }}
              onBulkInquiry={(slide) => {
                if (slide.secondaryLinkTarget) {
                  navigateCmsRedirect(
                    slide.secondaryLinkType ?? 'ROUTE',
                    slide.secondaryLinkTarget,
                  );
                } else {
                  router.push('/bulk-procurement/enquiry' as Href);
                }
              }}
            />
          </View>
        ) : null;

      case 'PROMO_BANNER':
      case 'HOME_PROMO':
        if (cmsLoading && promoSlides.length === 0) {
          return (
            <View key={sectionType} style={wrap}>
              <HomePromoBannerSkeleton />
            </View>
          );
        }
        return promoSlides.length > 0 ? (
          <View key={sectionType} style={wrap}>
            <HomePromoBanners
              slides={promoSlides}
              onPress={(slide) => {
                try {
                  if (slide.linkTarget) {
                    navigateCmsRedirect(
                      slide.linkType ?? 'ROUTE',
                      slide.linkTarget,
                    );
                  } else {
                    router.push('/(tabs)/catalog' as Href);
                  }
                } catch {
                  router.push('/(tabs)/catalog' as Href);
                }
              }}
            />
          </View>
        ) : null;

      case 'LOYALTY':
      case 'MEMBERSHIP':
        return null;

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
      case 'EMERGENCY_BANNER':
        return null;

      case 'VIDEO_BANNER':
        return videoBanner ? (
          <View key={sectionType} style={styles.section}>
            <VideoBanner banner={videoBanner} onShopNow={onVideoShopNow} />
          </View>
        ) : null;

      case 'ADVERTISEMENTS':
        return ads.length > 0 ? (
          <View key={sectionType} style={styles.section}>
            <BrandAdsSection
              ads={ads}
              title={sectionMeta(sectionType)?.title}
            />
          </View>
        ) : null;

      case 'OFFER_FOR_YOU':
        if (cmsLoading && offers.length === 0) {
          return (
            <View key={sectionType} style={styles.section}>
              <OfferForYouSkeleton />
            </View>
          );
        }
        if (cmsError && offers.length === 0) {
          if (__DEV__) {
            console.warn('[cms-home] Offers For You failed', cmsError);
          }
          return null;
        }
        return offers.length > 0 ? (
          <View key={sectionType} style={styles.section}>
            <OfferForYouSection
              offers={offers}
              title={sectionMeta(sectionType)?.title}
            />
          </View>
        ) : null;

      case 'QUICK_ACTIONS':
        return quickActions.length > 0 ? (
          <View key={sectionType} style={styles.section}>
            <QuickActionsRow actions={quickActions} />
          </View>
        ) : null;

      case 'TESTIMONIALS':
        return testimonialVideos.length > 0 || testimonialReviews.length > 0 ? (
          <View key={sectionType} style={styles.section}>
            <TestimonialCarousel
              videos={testimonialVideos}
              reviews={testimonialReviews}
              title={sectionMeta(sectionType)?.title}
              subtitle={sectionMeta(sectionType)?.subtitle}
              onHorizontalInteractionChange={handleTestimonialScrollInteraction}
            />
          </View>
        ) : null;

      case 'BULK_PROCUREMENT':
        return bulkProcurement ? (
          <View key={sectionType} style={styles.section}>
            <BulkProcurementCard
              onKnowMore={onBulkProcurement}
              promotion={bulkProcurement}
            />
          </View>
        ) : null;

      case 'FEATURED_PRODUCTS':
        return (
          <View key={sectionType} style={styles.section}>
            <HomeProductSection
              section="featured"
              title={
                sectionMeta(sectionType)?.title ?? t('featuredProducts')
              }
              subtitle={
                sectionMeta(sectionType)?.subtitle ??
                t('featuredProductsSubtitle')
              }
              products={featuredProducts}
              isLoading={homeProductsLoading}
            />
          </View>
        );

      case 'RECENTLY_ADDED':
        return (
          <View key={sectionType} style={styles.section}>
            <HomeProductSection
              section="new"
              title={sectionMeta(sectionType)?.title ?? t('recentlyAdded')}
              subtitle={
                sectionMeta(sectionType)?.subtitle ??
                t('recentlyAddedSubtitle')
              }
              products={recentlyAddedProducts}
              isLoading={homeProductsLoading}
              maxItems={6}
            />
          </View>
        );

      case 'TOP_DEALS':
        return (
          <View key={sectionType} style={styles.section}>
            <HomeProductSection
              section="offers"
              title={sectionMeta(sectionType)?.title ?? t('topDeals')}
              subtitle={
                sectionMeta(sectionType)?.subtitle ?? t('topDealsSubtitle')
              }
              products={topDealProducts}
              isLoading={homeProductsLoading}
            />
          </View>
        );

      case 'PRODUCT_DISCOVERY':
      case 'FEATURED_COLLECTION':
        return <HomeProductDiscovery key={sectionType} />;

      case 'RECOMMENDED':
        return <HomeProductDiscovery key={sectionType} />;

      case 'PRIORITY_EXPRESS':
        return null;

      default:
        return null;
    }
  };

  const showCmsFallback =
    Boolean(cmsError) && !cmsLoading && enabledSections.length === 0;

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
            onPressLocation={openDeliverySites}
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
              {showCmsFallback ? (
                <View style={styles.section}>
                  <CatalogErrorState
                    message={t('unableToLoadHome')}
                    onRetry={() => void refreshCms()}
                  />
                </View>
              ) : (
                <>
                  <View style={styles.sectionFlush}>
                    <DeliveryPromotionBanner
                      promotion={deliveryPromotion}
                      loading={deliveryPromoLoading}
                      onPress={(promo) => {
                        try {
                          if (promo.cta.enabled && promo.cta.value) {
                            navigateCmsRedirect(
                              promo.cta.type ?? 'ROUTE',
                              promo.cta.value,
                            );
                          }
                        } catch {
                          router.push('/(tabs)/catalog' as Href);
                        }
                      }}
                    />
                  </View>
                  {sectionOrder.map((type, index) => renderSection(type, index))}
                </>
              )}

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

      <SitesPickerSheet
        ref={sitesSheetRef}
        returnTo="home"
        onClose={closeDeliverySites}
        onSelect={closeDeliverySites}
      />
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
    paddingTop: 0,
  },
  section: {
    marginTop: SECTION_GAP,
  },
  sectionTight: {
    marginTop: TOP_CLUSTER_GAP,
  },
  sectionFlush: {
    marginTop: 0,
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
