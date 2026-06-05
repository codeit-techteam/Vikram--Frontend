import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AddSiteSheet } from '@components/AddSiteSheet';
import { PrimaryButton } from '@components/PrimaryButton';
import { ScaledPressable } from '@components/ScaledPressable';
import { SiteCard } from '@components/SiteCard';
import { useStrings } from '@hooks/useStrings';
import { useSiteStore, type DeliverySite } from '@store/useSiteStore';
import { safeGoBack } from '@utils/navigation';

const DEFAULT_REGION = {
  latitude: 12.9716,
  longitude: 77.5946,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function DeliveryLocationScreen() {
  const s = useStrings();
  const sites = useSiteStore((st) => st.sites);
  const addSite = useSiteStore((st) => st.addSite);
  const updateSite = useSiteStore((st) => st.updateSite);
  const removeSite = useSiteStore((st) => st.removeSite);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [editSite, setEditSite] = useState<DeliverySite | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualPincode, setManualPincode] = useState('');

  const requestLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      setPermissionGranted(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 600);
    } else {
      setPermissionGranted(false);
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const openAddSheet = () => {
    setEditSite(null);
    bottomSheetRef.current?.expand();
  };

  const handleEdit = (site: DeliverySite) => {
    setEditSite(site);
    bottomSheetRef.current?.expand();
  };

  const handleSaveSite = (data: Omit<DeliverySite, 'id'>) => {
    if (editSite) {
      updateSite(editSite.id, data);
    } else {
      addSite(data);
    }
    setEditSite(null);
  };

  const handleContinue = () => {
    router.replace('/(tabs)' as Href);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="mb-4 flex-row items-center justify-between bg-surface px-4 py-3">
          <ScaledPressable onPress={() => safeGoBack('/complete-profile')} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#FF6B00" />
          </ScaledPressable>
          <Text className="text-lg font-bold text-primary">{s.deliveryLocation}</Text>
          <View className="flex-row items-center gap-3">
            <Ionicons name="location-outline" size={22} color="#1A1A1A" />
            <View className="h-8 w-8 items-center justify-center rounded-full bg-primary">
              <Text className="text-xs font-bold text-text-inverse">CP</Text>
            </View>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="relative mx-4 mt-3 overflow-hidden rounded-card" style={{ height: 220 }}>
            {permissionGranted !== false ? (
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                region={region}
                onRegionChangeComplete={setRegion}
                showsUserLocation
                showsMyLocationButton={false}>
                <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }}>
                  <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
                    <Ionicons name="construct" size={20} color="#FFFFFF" />
                  </View>
                </Marker>
              </MapView>
            ) : (
              <View className="flex-1 items-center justify-center bg-[#1a2332]">
                <Ionicons name="map-outline" size={48} color="#666" />
                <Text className="mt-2 text-sm text-text-secondary">Location access required</Text>
              </View>
            )}

            <View className="absolute left-3 right-3 top-3">
              <View className="flex-row items-center rounded-input border border-border bg-surface px-3 py-2.5 shadow-sm">
                <Ionicons name="search" size={18} color="#FF6B00" />
                <Text className="ml-2 flex-1 text-sm text-text-secondary">{s.searchSiteAddress}</Text>
                <Ionicons name="mic-outline" size={18} color="#FF6B00" />
              </View>
            </View>

            <View className="absolute bottom-3 left-3">
              <View className="flex-row items-center gap-1.5 rounded-full border border-primary bg-surface px-3 py-1.5">
                <Ionicons name="shield-checkmark" size={12} color="#FF6B00" />
                <Text className="text-[10px] font-semibold text-primary">{s.preciseGpsPinning}</Text>
              </View>
            </View>

            <ScaledPressable
              onPress={requestLocation}
              className="absolute bottom-3 right-3 h-11 w-11 items-center justify-center rounded-full bg-primary shadow-md">
              <Ionicons name="locate" size={22} color="#FFFFFF" />
            </ScaledPressable>
          </View>

          {permissionGranted === false && (
            <View className="mx-4 mt-4 rounded-card bg-surface p-4">
              <Text className="mb-3 text-sm font-semibold text-text">{s.fullAddress}</Text>
              <TextInput
                value={manualAddress}
                onChangeText={setManualAddress}
                placeholder={s.addressLine1}
                placeholderTextColor="#999"
                className="mb-3 rounded-input border border-border bg-input px-4 py-3 text-base text-text"
              />
              <TextInput
                value={manualCity}
                onChangeText={setManualCity}
                placeholder={s.city}
                placeholderTextColor="#999"
                className="mb-3 rounded-input border border-border bg-input px-4 py-3 text-base text-text"
              />
              <TextInput
                value={manualPincode}
                onChangeText={setManualPincode}
                keyboardType="number-pad"
                placeholder={s.pincode}
                placeholderTextColor="#999"
                className="rounded-input border border-border bg-input px-4 py-3 text-base text-text"
              />
            </View>
          )}

          <View className="mx-4 mt-5">
            <Text className="text-lg font-bold text-text">{s.savedDeliverySites}</Text>
            <Text className="mt-0.5 text-sm text-text-secondary">{s.manageProjects}</Text>

            {sites.length > 0 ? (
              <View className="mt-4">
                {sites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    editLabel={s.edit}
                    deleteLabel={s.delete}
                    onEdit={handleEdit}
                    onDelete={removeSite}
                  />
                ))}
              </View>
            ) : (
              <ScaledPressable
                onPress={openAddSheet}
                className="mt-4 items-center rounded-card border-2 border-dashed border-border bg-surface py-8">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
                  <Ionicons name="add" size={28} color="#FFFFFF" />
                </View>
                <Text className="mt-3 text-base font-bold text-primary">{s.addNewSite}</Text>
                <Text className="mt-1 text-sm text-text-secondary">{s.registerDeliveryPoint}</Text>
              </ScaledPressable>
            )}
          </View>

          <View className="mx-4 mt-5 gap-3">
            <View className="flex-row gap-3 rounded-card bg-trust p-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
                <Ionicons name="shield-checkmark" size={20} color="#FF6B00" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-text">{s.industrialPrecision}</Text>
                <Text className="mt-1 text-xs leading-4 text-text-secondary">
                  {s.industrialPrecisionDesc}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3 rounded-card bg-trust p-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
                <Ionicons name="headset" size={20} color="#FF6B00" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-text">{s.siteLogisticsSupport}</Text>
                <Text className="mt-1 text-xs leading-4 text-text-secondary">
                  {s.siteLogisticsSupportDesc}
                </Text>
              </View>
            </View>
          </View>

          <View className="mx-4 mt-6 mb-4">
            <PrimaryButton title={s.allowFetchLocation} onPress={requestLocation} />
            {sites.length > 0 && (
              <View className="mt-3">
                <PrimaryButton title={s.continueBtn} onPress={handleContinue} showArrow />
              </View>
            )}
          </View>
        </ScrollView>

        <AddSiteSheet
          ref={bottomSheetRef}
          editSite={editSite}
          labels={{
            siteName: s.siteName,
            fullAddress: s.fullAddress,
            pincode: s.pincode,
            gateInstructions: s.gateInstructions,
            saveSite: s.saveSite,
          }}
          onSave={handleSaveSite}
          onClose={() => bottomSheetRef.current?.close()}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
