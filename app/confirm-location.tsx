import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import MapView, { Marker, type Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { PrimaryButton } from '@components/PrimaryButton';
import { SiteDetailsSheet } from '@components/location/SiteDetailsSheet';
import { LocationService, type ResolvedAddress } from '@services/LocationService';
import { theme } from '@constants/theme';

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
  const sheetRef = useRef<BottomSheetModal>(null);
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

  const onRegionChangeComplete = (next: Region) => {
    const nextCoords = { latitude: next.latitude, longitude: next.longitude };
    setCoords(nextCoords);
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => {
      void refreshAddress(next.latitude, next.longitude);
    }, 450);
  };

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
          style={{ flex: 1 }}
          region={region}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}>
          <Marker
            coordinate={coords}
            draggable
            onDragEnd={(e) => {
              const { latitude, longitude } = e.nativeEvent.coordinate;
              setCoords({ latitude, longitude });
              void refreshAddress(latitude, longitude);
            }}
          />
        </MapView>

        {/* Fixed center pin affordance when dragging map */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: '42%',
            left: 0,
            right: 0,
            alignItems: 'center',
          }}>
          <Ionicons name="location" size={36} color={theme.primary} />
        </View>

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
