import { memo, useCallback, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

import { InitialsAvatar } from '@components/InitialsAvatar';
import { SitesPickerSheet } from '@components/checkout/SitesPickerSheet';
import { theme } from '@constants/theme';
import { useCurrentSite, useSites } from '@hooks/useSites';
import { formatSiteType } from '@services/sites.api';
import { useAuthStore } from '@store/useAuthStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useUserStore } from '@store/userStore';

function getTimeGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/** First name only for compact greeting line. */
function firstName(full: string): string {
  const trimmed = full.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

interface HomeHeaderCardProps {
  scrollY?: SharedValue<number>;
}

function HomeHeaderCardComponent({ scrollY }: HomeHeaderCardProps) {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isGuest = useAuthStore((s) => s.isGuest);
  const sessionCustomer = useAuthStore((s) => s.customer);
  const userName = useUserStore((s) => s.user.name);
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

  const sheetRef = useRef<BottomSheetModal>(null);
  const showGuest = !isLoggedIn || isGuest;

  const displayName = useMemo(
    () => userName || sessionCustomer?.name || sessionCustomer?.phone || '',
    [userName, sessionCustomer?.name, sessionCustomer?.phone],
  );

  const greeting = useMemo(() => getTimeGreeting(), []);
  const shortName = useMemo(() => firstName(displayName), [displayName]);

  const siteMeta = useMemo(() => {
    if (!site) return null;
    return [formatSiteType(site.siteType), site.city].filter(Boolean).join(' · ');
  }, [site]);

  const openSites = useCallback(() => {
    if (showGuest) {
      router.push('/login');
      return;
    }
    sheetRef.current?.present();
  }, [showGuest]);

  const openProfile = useCallback(() => {
    if (showGuest) {
      router.push('/login');
      return;
    }
    router.push('/(tabs)/account');
  }, [showGuest]);

  const openDeliverySetup = useCallback(() => {
    if (showGuest) {
      router.push('/login');
      return;
    }
    router.push('/delivery-location');
  }, [showGuest]);

  const stripAnimStyle = useAnimatedStyle(() => {
    if (!scrollY) return {};
    const y = scrollY.value;
    return {
      opacity: interpolate(y, [0, 60], [1, 0.92], Extrapolation.CLAMP),
    };
  });

  if (showGuest) {
    return (
      <Animated.View style={[styles.wrap, stripAnimStyle]}>
        <Pressable onPress={openDeliverySetup} style={styles.strip} hitSlop={4}>
          <Ionicons name="location-sharp" size={18} color={theme.primary} />
          <View style={styles.mainCol}>
            <Text style={styles.deliverEyebrow}>Hello Guest</Text>
            <View style={styles.titleRow}>
              <Text style={styles.siteTitle} numberOfLines={1}>
                Select delivery location
              </Text>
              <Ionicons name="chevron-down" size={14} color="#666" />
            </View>
          </View>
          <Pressable onPress={() => router.push('/login')} style={styles.loginPill} hitSlop={6}>
            <Text style={styles.loginPillText}>Login</Text>
          </Pressable>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <>
      <Animated.View style={[styles.wrap, stripAnimStyle]}>
        <View style={styles.strip}>
          <Pressable onPress={openSites} style={styles.locationPress} hitSlop={4}>
            <Ionicons name="location-sharp" size={18} color={theme.primary} />
            <View style={styles.mainCol}>
              <Text style={styles.deliverEyebrow}>Delivering to</Text>
              <View style={styles.titleRow}>
                <Text style={styles.siteTitle} numberOfLines={1}>
                  {siteLoading ? 'Loading…' : site?.siteName ?? 'Add delivery site'}
                </Text>
                {site?.isPrimary ? <View style={styles.primaryDot} /> : null}
                <Ionicons name="chevron-down" size={14} color="#666" />
              </View>
              {siteMeta ? (
                <Text style={styles.metaLine} numberOfLines={1}>
                  {siteMeta}
                </Text>
              ) : null}
            </View>
          </Pressable>

          <Pressable onPress={openProfile} hitSlop={8} style={styles.avatarWrap}>
            <InitialsAvatar name={displayName || 'U'} size={36} />
          </Pressable>
        </View>

        {shortName ? (
          <Text style={styles.greetingLine} numberOfLines={1}>
            {greeting},{' '}
            <Text style={styles.greetingName}>{shortName}</Text>
          </Text>
        ) : null}
      </Animated.View>

      <SitesPickerSheet
        ref={sheetRef}
        onClose={() => sheetRef.current?.dismiss()}
        onSelect={() => sheetRef.current?.dismiss()}
      />
    </>
  );
}

export const HomeHeaderCard = memo(HomeHeaderCardComponent);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 8,
  },
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  locationPress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  mainCol: {
    flex: 1,
    minWidth: 0,
  },
  deliverEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: '#888888',
    lineHeight: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  siteTitle: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    lineHeight: 20,
  },
  primaryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.primary,
  },
  metaLine: {
    fontSize: 11,
    color: '#888888',
    marginTop: 1,
    lineHeight: 14,
  },
  avatarWrap: {
    marginLeft: 4,
  },
  greetingLine: {
    marginTop: 4,
    marginLeft: 26,
    fontSize: 12,
    fontWeight: '500',
    color: '#888888',
    lineHeight: 16,
  },
  greetingName: {
    fontWeight: '700',
    color: '#1A1A1A',
  },
  loginPill: {
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loginPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});
