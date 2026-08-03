import { memo, useCallback, useMemo, useRef } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Pressable as GHPressable } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type AnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { AppHeader } from '@components/AppHeader';
import { SearchHeader } from '@components/SearchHeader';
import { AppIcon } from '@components/ui/AppIcon';
import { SitesPickerSheet } from '@components/checkout/SitesPickerSheet';
import { ICON_SIZE } from '@constants/icons';
import { theme } from '@constants/theme';
import { useCurrentSite, useSites } from '@hooks/useSites';
import { formatSiteType } from '@services/sites.api';
import { useAuthStore } from '@store/useAuthStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { openVoiceAssistant } from '@components/VoiceAssistantSheet';

export const HOME_HEADER_SCROLL_RANGE = 72;
/** Fits "Delivering to" + site name + site meta (e.g. Office · Kalyani). */
const ADDRESS_EXPANDED_HEIGHT = 56;

interface HomeCollapsibleHeaderProps {
  scrollY: SharedValue<number>;
  onMenuPress?: () => void;
  isDrawerOpen?: boolean;
  menuIconStyle?: AnimatedStyle<ViewStyle>;
  onSearchFocus: () => void;
  onVoicePress?: () => void;
  /** Kept for API compatibility with HomeScreen. */
  searchQuery?: string;
  onSearchChange?: (text: string) => void;
  onSearchSubmit?: () => void;
  onSearchClear?: () => void;
}

/**
 * Home-only header: shared AppHeader + collapsing address + sticky SearchHeader.
 */
function HomeCollapsibleHeaderComponent({
  scrollY,
  onMenuPress,
  isDrawerOpen = false,
  menuIconStyle,
  onSearchFocus,
  onVoicePress,
}: HomeCollapsibleHeaderProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isGuest = useAuthStore((s) => s.isGuest);
  const selectedSiteId = useDeliveryStore((s) => s.selectedSiteId);
  const { data: sites = [] } = useSites(isLoggedIn && !isGuest);
  const { data: primarySite, isLoading: siteLoading } = useCurrentSite(
    isLoggedIn && !isGuest,
  );

  const site = useMemo(() => {
    if (selectedSiteId) {
      const fromList = sites.find((s) => s.id === selectedSiteId);
      if (fromList) return fromList;
    }
    return primarySite ?? sites.find((s) => s.isPrimary) ?? sites[0] ?? null;
  }, [selectedSiteId, sites, primarySite]);

  const siteMeta = useMemo(() => {
    if (!site) return null;
    return [formatSiteType(site.siteType), site.city].filter(Boolean).join(' · ');
  }, [site]);

  const sheetRef = useRef<BottomSheetModal>(null);
  const showGuest = !isLoggedIn || isGuest;

  const openSites = useCallback(() => {
    if (showGuest) {
      router.push('/login');
      return;
    }
    sheetRef.current?.present();
  }, [showGuest]);

  const openDeliverySetup = useCallback(() => {
    if (showGuest) {
      router.push('/login');
      return;
    }
    router.push('/delivery-location');
  }, [showGuest]);

  const addressStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, HOME_HEADER_SCROLL_RANGE],
      [ADDRESS_EXPANDED_HEIGHT, 0],
      Extrapolation.CLAMP,
    ),
    opacity: interpolate(
      scrollY.value,
      [0, HOME_HEADER_SCROLL_RANGE * 0.7],
      [1, 0],
      Extrapolation.CLAMP,
    ),
    marginBottom: interpolate(
      scrollY.value,
      [0, HOME_HEADER_SCROLL_RANGE],
      [8, 0],
      Extrapolation.CLAMP,
    ),
    overflow: 'hidden' as const,
  }));

  const handleVoice = onVoicePress ?? openVoiceAssistant;

  return (
    <>
      <AppHeader
        onMenuPress={onMenuPress}
        isDrawerOpen={isDrawerOpen}
        menuIconStyle={menuIconStyle}
        footer={
          <>
            <Animated.View style={addressStyle} pointerEvents="box-none">
              <GHPressable
                onPress={showGuest ? openDeliverySetup : openSites}
                style={styles.addressRow}
                hitSlop={6}>
                <AppIcon name="location" size={ICON_SIZE.small} color={theme.primary} />
                <View style={styles.addressCol}>
                  <Text style={styles.eyebrow}>Delivering to</Text>
                  <View style={styles.titleRow}>
                    <Text style={styles.siteTitle} numberOfLines={1}>
                      {showGuest
                        ? 'Select delivery location'
                        : siteLoading
                          ? 'Loading…'
                          : (site?.siteName ?? 'Add delivery site')}
                    </Text>
                    <AppIcon
                      name="chevronDown"
                      size={ICON_SIZE.small}
                      color={theme.textSecondary}
                    />
                  </View>
                  {!showGuest && siteMeta ? (
                    <Text style={styles.metaLine} numberOfLines={1}>
                      {siteMeta}
                    </Text>
                  ) : null}
                </View>
              </GHPressable>
            </Animated.View>

            <SearchHeader onPress={onSearchFocus} onVoicePress={handleVoice} />
          </>
        }
      />

      <SitesPickerSheet
        ref={sheetRef}
        onClose={() => sheetRef.current?.dismiss()}
        onSelect={() => sheetRef.current?.dismiss()}
      />
    </>
  );
}

export const HomeCollapsibleHeader = memo(HomeCollapsibleHeaderComponent);

const styles = StyleSheet.create({
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
  },
  addressCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.textSecondary,
    lineHeight: 13,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  siteTitle: {
    flexShrink: 1,
    fontSize: 13,
    fontWeight: '800',
    color: theme.textPrimary,
    lineHeight: 17,
  },
  metaLine: {
    fontSize: 11,
    color: theme.textSecondary,
    marginTop: 1,
    lineHeight: 14,
  },
});
