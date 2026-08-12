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
import { EmergencyBannerStrip } from '@components/home/EmergencyBannerStrip';
import { LoyaltyCard } from '@components/home/LoyaltyCard';
import { MaterialCategoriesGrid } from '@components/home/MaterialCategoriesGrid';
import { BulkProcurementCard } from '@components/home/BulkProcurementCard';
import { BrandAdsSection } from '@components/home/BrandAdsSection';
import { OfferForYouSection } from '@components/home/OfferForYouSection';
import { QuickActionsRow } from '@components/home/QuickActionsRow';
import { HomeProductDiscovery } from '@components/home/HomeProductDiscovery';
import { HomePromoBanners } from '@components/home/HomePromoBanners';
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
  filterMarketplaceCategories,
  getCategoryDisplayName,
  sortHomeCategories,
} from '@utils/categoryDisplay';
import {
  adaptCmsCategories,
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
    categories: rawHomeCategories,
    isLoading: categoriesLoading,
    isRefreshing: categoriesRefreshing,
    error: categoriesError,
    refresh: refreshCategories,
  } = useCategories();

  const {
    sections,
    banners,
    promoBanners,
    videoBanners,
    heroVideo,
    ads,
    testimonials,
    offers,
    quickActions,
    emergencyBanner,
    emergencyDelivery,
    bulkProcurement,
    categories: cmsCategories,
    isLoading: cmsLoading,
    isRefreshing: cmsRefreshing,
    error: cmsError,
    refresh: refreshCms,
  } = useCmsHome();

  const { isRefreshing: productsRefreshing, refresh: refreshHomeProducts } =
    useHomeProducts();

  const heroSlides = useMemo(() => adaptHeroSlides(banners), [banners]);
  const promoSlides = useMemo(
    () => adaptHeroSlides(promoBanners),
    [promoBanners],
  );
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
                  router.push('/bulk-procurement' as Href);
                }
              }}
            />
          </View>
        ) : null;

      case 'PROMO_BANNER':
      case 'HOME_PROMO':
        return promoSlides.length > 0 ? (
          <View key={sectionType} style={styles.section}>
            <HomePromoBanners
              slides={promoSlides}
              title={sectionMeta(sectionType)?.title}
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
        return emergencyDelivery ? (
          <View key={sectionType} style={styles.section}>
            <EmergencyCard
              onOrderNow={goEmergency}
              promotion={emergencyDelivery}
            />
          </View>
        ) : null;

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

      case 'EMERGENCY_BANNER':
        return emergencyBanner ? (
          <View key={sectionType} style={styles.section}>
            <EmergencyBannerStrip banner={emergencyBanner} />
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

      case 'MEMBERSHIP':
        return (
          <View key={sectionType} style={styles.section}>
            <MembershipBanner onPress={onOpenMembership} />
          </View>
        );

      case 'BULK_PROCUREMENT':
        return bulkProcurement ? (
          <View key={sectionType} style={styles.section}>
            <BulkProcurementCard
              onKnowMore={onBulkProcurement}
              promotion={bulkProcurement}
            />
          </View>
        ) : null;

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

  // Prefer CMS Homepage Layout order. Only auto-insert promo if layout has no
  // PROMO_BANNER row yet (pre-migration) and live HOME_PROMO banners exist.
  const sectionOrder = useMemo(() => {
    const order = enabledSections.map((s) => s.sectionType);
    const hasPromoSlot =
      order.includes('PROMO_BANNER') || order.includes('HOME_PROMO');
    if (promoSlides.length > 0 && !hasPromoSlot) {
      const heroIdx = order.indexOf('HERO_BANNER');
      if (heroIdx >= 0) {
        order.splice(heroIdx + 1, 0, 'PROMO_BANNER');
      } else {
        order.unshift('PROMO_BANNER');
      }
    }
    return order;
  }, [enabledSections, promoSlides.length]);

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
                sectionOrder.map((type) => renderSection(type))
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
