import { memo, useCallback, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
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
  /** Opens the saved-address sheet owned by HomeScreen. */
  onPressLocation?: () => void;
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
  onPressLocation,
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

  const showGuest = !isLoggedIn || isGuest;

  const openLocationPicker = useCallback(() => {
    void Haptics.selectionAsync();
    if (showGuest) {
      router.push('/login');
      return;
    }
    if (!siteLoading && sites.length === 0) {
      router.push('/delivery-location');
      return;
    }
    if (onPressLocation) {
      onPressLocation();
      return;
    }
    router.push('/delivery-location');
  }, [showGuest, siteLoading, sites.length, onPressLocation]);

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

  const locationLabel = showGuest
    ? 'Select delivery location'
    : siteLoading
      ? 'Loading…'
      : (site?.siteName ?? 'Add delivery site');

  return (
    <AppHeader
      onMenuPress={onMenuPress}
      isDrawerOpen={isDrawerOpen}
      menuIconStyle={menuIconStyle}
      footer={
        <>
            <Animated.View style={addressStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Delivering to ${locationLabel}. Change delivery address.`}
              onPress={openLocationPicker}
              hitSlop={8}
              collapsable={false}
              style={styles.addressRow}>
              <AppIcon name="location" size={ICON_SIZE.small} color={theme.primary} />
              <View style={styles.addressCol} pointerEvents="none">
                <Text style={styles.eyebrow}>Delivering to</Text>
                <View style={styles.titleRow}>
                  <Text style={styles.siteTitle} numberOfLines={1}>
                    {locationLabel}
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
            </Pressable>
          </Animated.View>

          <SearchHeader onPress={onSearchFocus} onVoicePress={handleVoice} />
        </>
      }
    />
  );
}

export const HomeCollapsibleHeader = memo(HomeCollapsibleHeaderComponent);

const styles = StyleSheet.create({
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 4,
    minHeight: 44,
    zIndex: 20,
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
