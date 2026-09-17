import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import MapView, { type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { PrimaryButton } from '@components/PrimaryButton';
import { SiteDetailsSheet } from '@components/location/SiteDetailsSheet';
import { LocationService, type ResolvedAddress } from '@services/LocationService';
import { theme } from '@constants/theme';

const PIN_SIZE = 40;
/** Tight enough to feel live, loose enough to stay inside Google's free tier. */
const GEOCODE_DEBOUNCE_MS = 450;

export default function ConfirmLocationScreen() {
  const params = useLocalSearchParams<{
    lat?: string;
    lng?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    returnTo?: string;
  }>();

  const initialLat = Number(params.lat) || 22.5726;
  const initialLng = Number(params.lng) || 88.3639;

  const [coords, setCoords] = useState({ latitude: initialLat, longitude: initialLng });
  const [resolved, setResolved] = useState<ResolvedAddress>({
    fullAddress: params.address ?? '',
    city: params.city ?? '',
    state: params.state ?? '',
    country: params.country ?? 'India',
    pincode: params.pincode ?? '',
    latitude: initialLat,
    longitude: initialLng,
  });
  const [geocoding, setGeocoding] = useState(false);
  const [recentering, setRecentering] = useState(false);
  const sheetRef = useRef<BottomSheetModal>(null);
  const mapRef = useRef<MapView>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const region: Region = useMemo(
    () => ({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }),
    [coords],
  );

  const refreshAddress = useCallback(async (latitude: number, longitude: number) => {
    setGeocoding(true);
    try {
      const addr = await LocationService.reverseGeocode(latitude, longitude);
      setResolved(addr);
    } catch {
      // keep previous readable address
    } finally {
      setGeocoding(false);
    }
  }, []);

  useEffect(() => {
    if (!params.address) {
      void refreshAddress(initialLat, initialLng);
    }
  }, [initialLat, initialLng, params.address, refreshAddress]);

  useEffect(
    () => () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    },
    [],
  );

  const onRegionChangeComplete = (next: Region) => {
    setCoords({ latitude: next.latitude, longitude: next.longitude });
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => {
      void refreshAddress(next.latitude, next.longitude);
    }, GEOCODE_DEBOUNCE_MS);
  };

  const recenterToUser = useCallback(async () => {
    setRecentering(true);
    try {
      await LocationService.ensureReady();
      const next = await LocationService.getCurrentPosition();
      // Animating the camera fires onRegionChangeComplete, which re-geocodes.
      mapRef.current?.animateToRegion({ ...next, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
    } catch {
      // The pin stays where it is; the user can still drag the map.
    } finally {
      setRecentering(false);
    }
  }, []);

  const handleConfirm = () => {
    sheetRef.current?.present();
  };

  const handleSaved = () => {
    sheetRef.current?.dismiss();
    const returnTo = params.returnTo;
    if (returnTo === 'checkout') {
      router.replace('/checkout' as Href);
    } else if (returnTo === 'account') {
      router.replace('/(tabs)/account' as Href);
    } else {
      router.replace('/(tabs)' as Href);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title="Confirm Location" titleColor={theme.primary} />

      <View className="flex-1">
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={region}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
          toolbarEnabled={false}
        />

        {/* Single centre pin: the map centre is the selected point, so the pin tip
            is offset by half its own height to land exactly on it. */}
        <View pointerEvents="none" style={styles.pinLayer}>
          <Ionicons
            name="location"
            size={PIN_SIZE}
            color={theme.primary}
            style={{ marginBottom: PIN_SIZE / 2 }}
          />
        </View>

        <Pressable
          onPress={() => void recenterToUser()}
          disabled={recentering}
          style={styles.recenterButton}
          hitSlop={8}>
          {recentering ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons name="locate" size={20} color={theme.primary} />
          )}
        </Pressable>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
          }}>
          <View
            style={{
              backgroundColor: '#fff',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              gap: 12,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 12,
              elevation: 8,
            }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#888', letterSpacing: 0.4 }}>
              DELIVERING TO
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Ionicons name="navigate" size={20} color={theme.primary} style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                {geocoding ? (
                  <ActivityIndicator color={theme.primary} />
                ) : (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#1A1A1A' }}>
                      {resolved.city || 'Selected area'}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#666', marginTop: 4, lineHeight: 18 }}>
                      {resolved.fullAddress || 'Move the pin to adjust location'}
                    </Text>
                  </>
                )}
              </View>
            </View>
            <PrimaryButton title="Confirm Location" onPress={handleConfirm} />
          </View>
        </KeyboardAvoidingView>
      </View>

      <SiteDetailsSheet
        ref={sheetRef}
        initialAddress={resolved}
        onSaved={handleSaved}
        onClose={() => sheetRef.current?.dismiss()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pinLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenterButton: {
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 22,
    bottom: 200,
    elevation: 6,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    width: 44,
  },
});
