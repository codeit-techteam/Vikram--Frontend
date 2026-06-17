import { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import * as Location from 'expo-location';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { AddSiteSheet } from '@components/AddSiteSheet';
import { PrimaryButton } from '@components/PrimaryButton';
import { ScaledPressable } from '@components/ScaledPressable';
import { SiteCard } from '@components/SiteCard';
import { useTranslation } from '@store/languageStore';
import { useSiteStore, type DeliverySite } from '@store/useSiteStore';

export default function DeliveryLocationScreen() {
  const { t } = useTranslation();
  const sites = useSiteStore((st) => st.sites);
  const addSite = useSiteStore((st) => st.addSite);
  const updateSite = useSiteStore((st) => st.updateSite);
  const removeSite = useSiteStore((st) => st.removeSite);

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [locationLabel, setLocationLabel] = useState('Bangalore, Karnataka');
  const [editSite, setEditSite] = useState<DeliverySite | null>(null);
  const [manualAddress, setManualAddress] = useState('');
  const [manualCity, setManualCity] = useState('');
  const [manualPincode, setManualPincode] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);

  const requestLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setShowManualForm(true);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocationLabel(`${loc.coords.latitude.toFixed(4)}, ${loc.coords.longitude.toFixed(4)}`);
      setShowManualForm(false);
    } catch {
      setShowManualForm(true);
    }
  }, []);

  const openAddSheet = () => {
    setEditSite(null);
    bottomSheetRef.current?.present();
  };

  const handleEdit = (site: DeliverySite) => {
    setEditSite(site);
    bottomSheetRef.current?.present();
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

  const closeSheet = () => {
    bottomSheetRef.current?.dismiss();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <BackHeader
          title={t('deliveryLocation')}
          titleColor="#FEB623"
          rightElement={
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <TouchableOpacity hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="location-outline" size={20} color="#FEB623" />
              </TouchableOpacity>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#FEB623',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#1A1A1A' }}>CP</Text>
              </View>
            </View>
          }
        />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="relative mx-4 mt-3 overflow-hidden rounded-card" style={{ height: 220 }}>
            <View className="flex-1 items-center justify-center bg-[#1a2332]">
              <Ionicons name="map" size={48} color="#FEB623" />
              <Text className="mt-3 text-sm font-semibold text-white">{locationLabel}</Text>
              <Text className="mt-1 px-6 text-center text-xs text-white/70">
                {t('preciseGpsPinning')}
              </Text>
            </View>

            <View className="absolute left-3 right-3 top-3">
              <View className="flex-row items-center rounded-input border border-border bg-surface px-3 py-2.5 shadow-sm">
                <Ionicons name="search" size={18} color="#FEB623" />
                <Text className="ml-2 flex-1 text-sm text-text-secondary">{t('searchSiteAddress')}</Text>
              </View>
            </View>

            <ScaledPressable
              onPress={requestLocation}
              className="absolute bottom-3 right-3 h-11 w-11 items-center justify-center rounded-full bg-primary shadow-md">
              <Ionicons name="locate" size={22} color="#FFFFFF" />
            </ScaledPressable>
          </View>

          {showManualForm && (
            <View className="mx-4 mt-4 rounded-card bg-surface p-4">
              <Text className="mb-3 text-sm font-semibold text-text">{t('fullAddress')}</Text>
              <TextInput
                value={manualAddress}
                onChangeText={setManualAddress}
                placeholder={t('addressLine1')}
                placeholderTextColor="#999"
                className="mb-3 rounded-input border border-border bg-input px-4 py-3 text-base text-text"
              />
              <TextInput
                value={manualCity}
                onChangeText={setManualCity}
                placeholder={t('city')}
                placeholderTextColor="#999"
                className="mb-3 rounded-input border border-border bg-input px-4 py-3 text-base text-text"
              />
              <TextInput
                value={manualPincode}
                onChangeText={setManualPincode}
                keyboardType="number-pad"
                placeholder={t('pincode')}
                placeholderTextColor="#999"
                className="rounded-input border border-border bg-input px-4 py-3 text-base text-text"
              />
            </View>
          )}

          <View className="mx-4 mt-5">
            <Text className="text-lg font-bold text-text">{t('savedDeliverySites')}</Text>
            <Text className="mt-0.5 text-sm text-text-secondary">{t('manageProjects')}</Text>

            {sites.length > 0 ? (
              <View className="mt-4">
                {sites.map((site) => (
                  <SiteCard
                    key={site.id}
                    site={site}
                    editLabel={t('edit')}
                    deleteLabel={t('delete')}
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
                <Text className="mt-3 text-base font-bold text-primary">{t('addNewSite')}</Text>
                <Text className="mt-1 text-sm text-text-secondary">{t('registerDeliveryPoint')}</Text>
              </ScaledPressable>
            )}
          </View>

          <View className="mx-4 mt-5 gap-3">
            <View className="flex-row gap-3 rounded-card bg-trust p-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
                <Ionicons name="shield-checkmark" size={20} color="#FEB623" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-text">{t('industrialPrecision')}</Text>
                <Text className="mt-1 text-xs leading-4 text-text-secondary">
                  {t('industrialPrecisionDesc')}
                </Text>
              </View>
            </View>
            <View className="flex-row gap-3 rounded-card bg-trust p-4">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-surface">
                <Ionicons name="headset" size={20} color="#FEB623" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-text">{t('siteLogisticsSupport')}</Text>
                <Text className="mt-1 text-xs leading-4 text-text-secondary">
                  {t('siteLogisticsSupportDesc')}
                </Text>
              </View>
            </View>
          </View>

          <View className="mx-4 mt-6 mb-4">
            <PrimaryButton title={t('allowFetchLocation')} onPress={requestLocation} />
            <View className="mt-3">
              <PrimaryButton title={t('continueBtn')} onPress={handleContinue} showArrow />
            </View>
          </View>
        </ScrollView>

        <AddSiteSheet
          ref={bottomSheetRef}
          editSite={editSite}
          labels={{
            siteName: t('siteName'),
            fullAddress: t('fullAddress'),
            pincode: t('pincode'),
            gateInstructions: t('gateInstructions'),
            saveSite: t('saveSite'),
          }}
          onSave={handleSaveSite}
          onClose={closeSheet}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
