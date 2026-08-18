import { forwardRef, useCallback, useMemo } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { router, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { theme } from '@constants/theme';
import { useSiteMutations, useSites } from '@hooks/useSites';
import { formatSiteType, type DeliverySite } from '@services/sites.api';
import { useDeliveryStore } from '@store/deliveryStore';
import { useEtaStore } from '@store/etaStore';
import { useServiceabilityStore } from '@store/serviceabilityStore';
import { isValidDeliveryCoordinates } from '@utils/geo';

interface SitesPickerSheetProps {
  onClose: () => void;
  onSelect?: (site: DeliverySite) => void;
  returnTo?: 'home' | 'checkout' | 'account';
}

export const SitesPickerSheet = forwardRef<BottomSheetModal, SitesPickerSheetProps>(
  ({ onClose, onSelect, returnTo = 'home' }, ref) => {
    const { data: sites = [], isLoading } = useSites();
    const selectedSiteId = useDeliveryStore((s) => s.selectedSiteId);
    const setSelectedSite = useDeliveryStore((s) => s.setSelectedSite);
    const { remove, setPrimary } = useSiteMutations();
    const snapPoints = useMemo(() => ['55%', '80%'], []);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      [],
    );

    const applySite = (site: DeliverySite) => {
      void Haptics.selectionAsync();
      setSelectedSite(site.id);
      useEtaStore.getState().clearEta();
      if (isValidDeliveryCoordinates(site.latitude, site.longitude)) {
        useEtaStore.getState().setLocation(site.latitude, site.longitude, site.pincode);
        void useServiceabilityStore
          .getState()
          .check(site.latitude, site.longitude, site.pincode);
      } else {
        useServiceabilityStore.getState().clear();
      }
      onSelect?.(site);
    };

    const pick = (site: DeliverySite) => {
      applySite(site);
      onClose();
    };

    const openAddressScreen = (siteId?: string) => {
      onClose();
      requestAnimationFrame(() => {
        router.push({
          pathname: '/delivery-location',
          params: siteId
            ? { returnTo, siteId }
            : { returnTo },
        } as Href);
      });
    };

    const confirmDelete = (site: DeliverySite) => {
      if (sites.length <= 1) {
        Alert.alert(
          'Cannot delete',
          'Add another delivery address before deleting this one.',
        );
        return;
      }
      Alert.alert('Delete address', `Remove ${site.siteName}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => remove.mutate(site.id),
        },
      ]);
    };

    return (
      <BottomSheetModal
        ref={ref}
        name="delivery-sites-picker"
        snapPoints={snapPoints}
        enablePanDownToClose
        enableDismissOnClose
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        backgroundStyle={{ borderRadius: 20, backgroundColor: '#FFFFFF' }}
        handleIndicatorStyle={{ backgroundColor: '#D0D0D0', width: 40 }}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 4, color: '#1A1A1A' }}>
            Select Delivery Address
          </Text>
          <Text style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
            Choose a saved site or add a new one. Delivery estimate updates for that location.
          </Text>

          {isLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : sites.length === 0 ? (
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
              <Ionicons name="map-outline" size={40} color="#D4C89A" />
              <Text style={{ color: '#1A1A1A', fontWeight: '700', textAlign: 'center' }}>
                No saved addresses yet
              </Text>
              <Text style={{ color: '#666', textAlign: 'center' }}>
                Add a delivery address to see products and delivery times for your site.
              </Text>
              <Pressable
                onPress={() => openAddressScreen()}
                style={{
                  backgroundColor: theme.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}>
                <Text style={{ fontWeight: '800', color: '#1A1A1A' }}>+ Add Address</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {sites.map((site) => {
                const selected = site.id === selectedSiteId;
                return (
                  <Pressable
                    key={site.id}
                    onPress={() => pick(site)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${site.siteName}${site.isPrimary ? ', default' : ''}`}
                    style={{
                      borderWidth: 1.5,
                      borderColor: selected ? theme.primary : '#E8E0C8',
                      borderRadius: 14,
                      padding: 14,
                      backgroundColor: selected ? '#FFF8E7' : '#FFFEF8',
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                      <View
                        style={{
                          marginTop: 2,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: 2,
                          borderColor: selected ? theme.primary : '#CCC',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selected ? theme.primary : 'transparent',
                        }}>
                        {selected ? (
                          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                        ) : null}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 8,
                          }}>
                          <Text style={{ fontWeight: '800', fontSize: 15, flex: 1, color: '#1A1A1A' }}>
                            {site.siteName}
                          </Text>
                          {site.isPrimary ? (
                            <Text
                              style={{
                                color: theme.primary,
                                fontWeight: '800',
                                fontSize: 11,
                              }}>
                              DEFAULT
                            </Text>
                          ) : null}
                        </View>
                        <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                          {formatSiteType(site.siteType)}
                        </Text>
                        <Text
                          style={{ color: '#555', marginTop: 6, fontSize: 13 }}
                          numberOfLines={2}>
                          {site.fullAddress}
                        </Text>
                        <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>
                          {[site.city, site.pincode].filter(Boolean).join(', ')}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 16, marginTop: 10 }}>
                          {!site.isPrimary ? (
                            <Pressable
                              onPress={() => setPrimary.mutate(site.id)}
                              hitSlop={8}>
                              <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 12 }}>
                                Set Default
                              </Text>
                            </Pressable>
                          ) : null}
                          <Pressable
                            onPress={() => openAddressScreen(site.id)}
                            hitSlop={8}>
                            <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 12 }}>
                              Edit
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => confirmDelete(site)} hitSlop={8}>
                            <Text style={{ color: '#C0392B', fontWeight: '600', fontSize: 12 }}>
                              Delete
                            </Text>
                          </Pressable>
                        </View>
                      </View>
                    </View>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => openAddressScreen()}
                style={{
                  marginTop: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderWidth: 1,
                  borderColor: theme.primary,
                  borderRadius: 14,
                  paddingVertical: 14,
                }}>
                <Ionicons name="add" size={18} color={theme.primary} />
                <Text style={{ fontWeight: '700', color: theme.primary }}>
                  + Add New Address
                </Text>
              </Pressable>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

SitesPickerSheet.displayName = 'SitesPickerSheet';
