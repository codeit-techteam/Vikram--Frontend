import { forwardRef, useCallback, useMemo } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '@constants/theme';
import { useSites } from '@hooks/useSites';
import { formatSiteType, type DeliverySite } from '@services/sites.api';
import { useDeliveryStore } from '@store/deliveryStore';

interface SitesPickerSheetProps {
  onClose: () => void;
  onSelect?: (site: DeliverySite) => void;
}

export const SitesPickerSheet = forwardRef<BottomSheetModal, SitesPickerSheetProps>(
  ({ onClose, onSelect }, ref) => {
    const { data: sites = [], isLoading } = useSites();
    const selectedSiteId = useDeliveryStore((s) => s.selectedSiteId);
    const setSelectedSite = useDeliveryStore((s) => s.setSelectedSite);
    const snapPoints = useMemo(() => ['55%', '75%'], []);

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

    const pick = (site: DeliverySite) => {
      setSelectedSite(site.id);
      onSelect?.(site);
      onClose();
    };

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        onDismiss={onClose}
        backgroundStyle={{ borderRadius: 20 }}>
        <BottomSheetScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 16 }}>
            Deliver To
          </Text>

          {isLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : sites.length === 0 ? (
            <View style={{ alignItems: 'center', gap: 12, paddingVertical: 24 }}>
              <Text style={{ color: '#666', textAlign: 'center' }}>
                Add a delivery address to continue checkout.
              </Text>
              <Pressable
                onPress={() => {
                  onClose();
                  router.push({
                    pathname: '/delivery-location',
                    params: { returnTo: 'checkout' },
                  });
                }}
                style={{
                  backgroundColor: theme.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 12,
                }}>
                <Text style={{ fontWeight: '800' }}>Add Delivery Address</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {sites.map((site) => {
                const selected = site.id === selectedSiteId || site.isPrimary;
                return (
                  <Pressable
                    key={site.id}
                    onPress={() => pick(site)}
                    style={{
                      borderWidth: 1.5,
                      borderColor: selected ? theme.primary : '#E8E0C8',
                      borderRadius: 14,
                      padding: 14,
                      backgroundColor: selected ? '#FFF8E7' : '#FFFEF8',
                    }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontWeight: '800', fontSize: 15 }}>{site.siteName}</Text>
                      {site.isPrimary ? (
                        <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 11 }}>
                          PRIMARY
                        </Text>
                      ) : null}
                    </View>
                    <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>
                      {formatSiteType(site.siteType)}
                    </Text>
                    <Text style={{ color: '#555', marginTop: 6, fontSize: 13 }} numberOfLines={2}>
                      {site.fullAddress}
                    </Text>
                  </Pressable>
                );
              })}

              <Pressable
                onPress={() => {
                  onClose();
                  router.push({
                    pathname: '/delivery-location',
                    params: { returnTo: 'checkout' },
                  });
                }}
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
                <Text style={{ fontWeight: '700', color: theme.primary }}>Add New Site</Text>
              </Pressable>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  },
);

SitesPickerSheet.displayName = 'SitesPickerSheet';
