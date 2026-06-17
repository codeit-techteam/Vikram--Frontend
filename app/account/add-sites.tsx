import { useRef, useState } from 'react';
import { FlatList, Linking, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import MapView, { Marker } from 'react-native-maps';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { ProjectSiteSheet } from '@components/account/ProjectSiteSheet';
import { ScaledPressable } from '@components/ScaledPressable';
import type { ProjectSite } from '@store/deliveryStore';
import { useDeliveryStore } from '@store/deliveryStore';
import { useTranslation } from '@store/languageStore';
import { safeGoBack } from '@utils/navigation';

export default function AddSitesScreen() {
  const { t } = useTranslation();
  const projectSites = useDeliveryStore((st) => st.projectSites);
  const addProjectSite = useDeliveryStore((st) => st.addProjectSite);
  const updateProjectSite = useDeliveryStore((st) => st.updateProjectSite);

  const sheetRef = useRef<BottomSheet>(null);
  const [editSite, setEditSite] = useState<ProjectSite | null>(null);

  const openAdd = () => {
    setEditSite(null);
    sheetRef.current?.expand();
  };

  const handleContact = async (phone: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('deliverySites')} onBack={() => safeGoBack('/(tabs)/account')} />

      <FlatList
        data={projectSites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListHeaderComponent={
          <ScaledPressable
            onPress={openAdd}
            className="mb-4 flex-row items-center justify-center gap-2 rounded-pill bg-primary py-3.5">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-white">
              <Ionicons name="add" size={16} color="#FEB623" />
            </View>
            <Text className="text-sm font-bold text-onPrimary">{t('addNewProjectSite')}</Text>
          </ScaledPressable>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 80).duration(300)}>
            <SiteCard site={item} onContact={handleContact} t={t} />
          </Animated.View>
        )}
      />

      <ProjectSiteSheet
        ref={sheetRef}
        editSite={editSite}
        onClose={() => {
          sheetRef.current?.close();
          setEditSite(null);
        }}
        onSave={(data) => {
          if (editSite) {
            updateProjectSite(editSite.id, data);
          } else {
            addProjectSite({
              ...data,
              warehouseDist: data.warehouseDist || `${(Math.random() * 15 + 5).toFixed(1)} km`,
              estDelivery: data.estDelivery || `${Math.floor(Math.random() * 90 + 30)}m`,
            });
          }
        }}
      />
    </SafeAreaView>
  );
}

function SiteCard({
  site,
  onContact,
  t,
}: {
  site: ProjectSite;
  onContact: (phone: string) => void;
  t: (key: import('@constants/strings').StringKey) => string;
}) {
  const isActive = site.status === 'active';

  return (
    <View className="mb-4 overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <View style={{ height: 100, overflow: 'hidden' }}>
        <MapView
          style={{ flex: 1 }}
          scrollEnabled={false}
          zoomEnabled={false}
          pitchEnabled={false}
          rotateEnabled={false}
          region={{
            latitude: site.lat,
            longitude: site.lng,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}>
          <Marker coordinate={{ latitude: site.lat, longitude: site.lng }} pinColor="#FEB623" />
        </MapView>
      </View>

      <View className="p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-text">{site.name}</Text>
          <View
            className={`rounded px-2 py-0.5 ${isActive ? 'bg-info/15' : 'bg-border'}`}>
            <Text
              className={`text-[10px] font-bold ${isActive ? 'text-info' : 'text-text-secondary'}`}>
              {site.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View className="mt-2 flex-row items-center">
          <Ionicons name="person-outline" size={14} color="#999999" />
          <Text className="ml-1 text-xs text-text-secondary">{site.contact}</Text>
          <Text className="mx-1 text-xs text-text-secondary">•</Text>
          <ScaledPressable onPress={() => onContact(site.phone)}>
            <Text className="text-xs font-semibold text-primary">{t('contactLink')}</Text>
          </ScaledPressable>
        </View>

        <View className="mt-3 flex-row gap-2 rounded-lg bg-info/10 p-3">
          <LogisticsPill icon="location-outline" label={t('warehouseDist')} value={site.warehouseDist} />
          <LogisticsPill icon="time-outline" label={t('estDelivery')} value={site.estDelivery} />
        </View>

        {site.gateNote && (
          <View className="mt-3 flex-row rounded-lg border-l-4 border-primary bg-background p-3">
            <Ionicons name="information-circle-outline" size={16} color="#FEB623" />
            <Text className="ml-2 flex-1 text-xs text-text-secondary">{site.gateNote}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function LogisticsPill({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-1">
        <Ionicons name={icon} size={12} color="#FEB623" />
        <Text className="text-[10px] text-text-secondary">{label}</Text>
      </View>
      <Text className="mt-0.5 text-sm font-bold text-text">{value}</Text>
    </View>
  );
}
