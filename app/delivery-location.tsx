import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { PrimaryButton } from '@components/PrimaryButton';
import { SiteDetailsSheet } from '@components/location/SiteDetailsSheet';
import { theme } from '@constants/theme';
import { useSiteMutations, useSites } from '@hooks/useSites';
import {
  LocationService,
  type PlaceSuggestion,
  type ResolvedAddress,
} from '@services/LocationService';
import {
  formatSiteType,
  type DeliverySite,
} from '@services/sites.api';

export default function DeliveryLocationScreen() {
  const params = useLocalSearchParams<{ returnTo?: string; mode?: string; siteId?: string }>();
  const { data: sites = [], isLoading, isRefetching, refetch, isError } = useSites();
  const { remove, setPrimary } = useSiteMutations();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [listFilter, setListFilter] = useState('');
  const [editSite, setEditSite] = useState<DeliverySite | null>(null);
  const [sheetAddress, setSheetAddress] = useState<ResolvedAddress | null>(null);

  const sheetRef = useRef<BottomSheetModal>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedEditId = useRef<string | null>(null);

  const filteredSites = useMemo(() => {
    const q = listFilter.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter(
      (s) =>
        s.siteName.toLowerCase().includes(q) ||
        s.fullAddress.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q),
    );
  }, [sites, listFilter]);

  const openConfirm = useCallback(
    (addr: ResolvedAddress) => {
      router.push({
        pathname: '/confirm-location',
        params: {
          lat: String(addr.latitude),
          lng: String(addr.longitude),
          address: addr.fullAddress,
          city: addr.city,
          state: addr.state,
          pincode: addr.pincode,
          country: addr.country,
          returnTo: params.returnTo ?? 'home',
        },
      } as unknown as Href);
    },
    [params.returnTo],
  );

  const onSearchChange = (text: string) => {
    setQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (text.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await LocationService.searchPlaces(text);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const onSelectSuggestion = async (item: PlaceSuggestion) => {
    setQuery(item.description);
    setSuggestions([]);
    setSearching(true);
    try {
      const addr = await LocationService.resolvePlace(item.placeId);
      openConfirm(addr);
    } catch {
      setGpsError('Unable to resolve that place. Try again or use current location.');
    } finally {
      setSearching(false);
    }
  };

  const onFetchLocation = async () => {
    setGpsError(null);
    setFetchingGps(true);
    try {
      const addr = await LocationService.fetchCurrentAddress();
      openConfirm(addr);
    } catch (e) {
      const code = (e as Error)?.message;
      if (code === 'LOCATION_PERMISSION_DENIED') {
        setGpsError('Location permission denied. Search an address instead.');
      } else {
        setGpsError('Could not fetch location. Check GPS and try again.');
      }
    } finally {
      setFetchingGps(false);
    }
  };

  const handleContinue = () => {
    if (sites.length === 0) return;
    const returnTo = params.returnTo;
    if (returnTo === 'checkout') {
      router.replace('/checkout' as Href);
    } else if (returnTo === 'account') {
      router.replace('/(tabs)/account' as Href);
    } else {
      router.replace('/(tabs)' as Href);
    }
  };

  const openEdit = (site: DeliverySite) => {
    setEditSite(site);
    setSheetAddress({
      fullAddress: site.fullAddress,
      city: site.city,
      state: site.state,
      country: site.country,
      pincode: site.pincode,
      latitude: site.latitude,
      longitude: site.longitude,
    });
    sheetRef.current?.present();
  };

  useEffect(() => {
    const siteId = Array.isArray(params.siteId) ? params.siteId[0] : params.siteId;
    if (!siteId || sites.length === 0) return;
    if (openedEditId.current === siteId) return;
    const match = sites.find((s) => s.id === siteId);
    if (!match) return;
    openedEditId.current = siteId;
    openEdit(match);
  }, [params.siteId, sites]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BackHeader title="Delivery Location" titleColor={theme.primary} />

        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFFEF8',
              borderWidth: 1,
              borderColor: '#E8E0C8',
              borderRadius: 14,
              paddingHorizontal: 12,
              height: 48,
            }}>
            <Ionicons name="search" size={18} color="#888" />
            <TextInput
              value={query}
              onChangeText={onSearchChange}
              placeholder="Search address (Kalyani, Salt Lake, BKC…)"
              placeholderTextColor="#AAA"
              style={{ flex: 1, marginLeft: 8, fontSize: 15, color: '#1A1A1A' }}
              autoCorrect={false}
            />
            {searching ? <ActivityIndicator size="small" color={theme.primary} /> : null}
          </View>

          {suggestions.length > 0 ? (
            <View
              style={{
                marginTop: 6,
                backgroundColor: '#fff',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E8E0C8',
                maxHeight: 220,
                overflow: 'hidden',
              }}>
              <FlatList
                keyboardShouldPersistTaps="handled"
                data={suggestions}
                keyExtractor={(item) => item.placeId}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => void onSelectSuggestion(item)}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: '#F3EEE0',
                    }}>
                    <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>{item.mainText}</Text>
                    {item.secondaryText ? (
                      <Text style={{ color: '#777', fontSize: 12, marginTop: 2 }}>
                        {item.secondaryText}
                      </Text>
                    ) : null}
                  </Pressable>
                )}
              />
            </View>
          ) : null}

          <Pressable
            onPress={() => void onFetchLocation()}
            disabled={fetchingGps}
            style={{
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#1A1A1A',
              borderRadius: 14,
              height: 48,
            }}>
            {fetchingGps ? (
              <ActivityIndicator color={theme.primary} />
            ) : (
              <>
                <Ionicons name="locate" size={18} color={theme.primary} />
                <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 15 }}>
                  Allow Fetch Location
                </Text>
              </>
            )}
          </Pressable>
          {gpsError ? (
            <Text style={{ color: '#C0392B', marginTop: 8, fontSize: 13 }}>{gpsError}</Text>
          ) : null}
        </View>

        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
              marginTop: 8,
            }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1A1A' }}>
              Saved Delivery Sites
            </Text>
            {sites.length > 3 ? (
              <TextInput
                value={listFilter}
                onChangeText={setListFilter}
                placeholder="Search sites"
                placeholderTextColor="#AAA"
                style={{
                  width: 120,
                  borderWidth: 1,
                  borderColor: '#E8E0C8',
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  fontSize: 12,
                }}
              />
            ) : null}
          </View>

          {isLoading ? (
            <View style={{ gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <View
                  key={i}
                  style={{
                    height: 88,
                    borderRadius: 14,
                    backgroundColor: '#F5F0E0',
                  }}
                />
              ))}
            </View>
          ) : isError ? (
            <View style={{ alignItems: 'center', paddingVertical: 40, gap: 12 }}>
              <Ionicons name="cloud-offline-outline" size={40} color="#C0392B" />
              <Text style={{ color: '#1A1A1A', fontWeight: '700', textAlign: 'center' }}>
                Can’t reach the server
              </Text>
              <Text style={{ color: '#666', textAlign: 'center', paddingHorizontal: 16 }}>
                Check that the backend is running and EXPO_PUBLIC_API_URL matches your Mac IP
                (ipconfig getifaddr en0). Then pull to retry.
              </Text>
              <PrimaryButton title="Retry" onPress={() => void refetch()} />
            </View>
          ) : filteredSites.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 48, gap: 10 }}>
              <Ionicons name="map-outline" size={56} color="#D4C89A" />
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
                No saved delivery sites yet
              </Text>
              <Text style={{ color: '#888', textAlign: 'center', paddingHorizontal: 24 }}>
                Search an address or use your current location to add your first site.
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredSites}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={() => void refetch()}
                  tintColor={theme.primary}
                />
              }
              contentContainerStyle={{ paddingBottom: 120, gap: 10 }}
              renderItem={({ item }) => (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: item.isPrimary ? theme.primary : '#E8E0C8',
                    borderRadius: 14,
                    padding: 14,
                    backgroundColor: '#FFFEF8',
                  }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontWeight: '800', fontSize: 15, color: '#1A1A1A' }}>
                          {item.siteName}
                        </Text>
                        {item.isPrimary ? (
                          <View
                            style={{
                              backgroundColor: theme.primary,
                              borderRadius: 6,
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                            }}>
                            <Text style={{ fontSize: 10, fontWeight: '800' }}>PRIMARY</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                        {formatSiteType(item.siteType)}
                      </Text>
                      <Text style={{ color: '#555', fontSize: 13, marginTop: 6 }} numberOfLines={2}>
                        {item.fullAddress}
                      </Text>
                      <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                        {item.city}
                        {item.pincode ? ` · ${item.pincode}` : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
                    <Pressable onPress={() => openEdit(item)}>
                      <Text style={{ color: theme.primary, fontWeight: '700' }}>Edit</Text>
                    </Pressable>
                    {!item.isPrimary ? (
                      <Pressable onPress={() => setPrimary.mutate(item.id)}>
                        <Text style={{ color: '#1A1A1A', fontWeight: '600' }}>Set Primary</Text>
                      </Pressable>
                    ) : null}
                    <Pressable onPress={() => remove.mutate(item.id)}>
                      <Text style={{ color: '#C0392B', fontWeight: '600' }}>Delete</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#F0EAD8' }}>
          <PrimaryButton
            title={sites.length === 0 ? 'Add a site to continue' : 'Continue'}
            onPress={handleContinue}
            disabled={sites.length === 0}
          />
        </View>
      </KeyboardAvoidingView>

      {sheetAddress ? (
        <SiteDetailsSheet
          ref={sheetRef}
          initialAddress={sheetAddress}
          editSite={editSite}
          onSaved={() => {
            sheetRef.current?.dismiss();
            setEditSite(null);
          }}
          onClose={() => {
            sheetRef.current?.dismiss();
            setEditSite(null);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}
