import { useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, Text, View } from 'react-native';
import MapView, { Marker, Polyline, type Region } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BackHeader } from '@components/BackHeader';
import { PulseDot } from '@components/orders/PulseDot';
import { ScaledPressable } from '@components/ScaledPressable';
import { useLanguageStore, useTranslation } from '@store/languageStore';
import { useOrderStore } from '@store/orderStore';
import { safeGoBack } from '@utils/navigation';

const WAREHOUSE = { latitude: 19.2183, longitude: 72.9781 };
const DESTINATION = { latitude: 19.1136, longitude: 72.8697 };
const DRIVER_AVATAR =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&q=80';

const INITIAL_REGION: Region = {
  latitude: 19.16,
  longitude: 72.92,
  latitudeDelta: 0.15,
  longitudeDelta: 0.15,
};

export default function OrderDetailsScreen() {
  const language = useLanguageStore((s) => s.language);
  const { t } = useTranslation();
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const order = useOrderStore((s) => s.getOrder(orderId ?? ''));
  const [truckPos, setTruckPos] = useState(WAREHOUSE);
  const progress = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      progress.current = Math.min(1, progress.current + 0.02);
      setTruckPos({
        latitude:
          WAREHOUSE.latitude + (DESTINATION.latitude - WAREHOUSE.latitude) * progress.current,
        longitude:
          WAREHOUSE.longitude + (DESTINATION.longitude - WAREHOUSE.longitude) * progress.current,
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!order) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-background">
        <Text className="text-text-secondary">{t('productNotFound')}</Text>
        <ScaledPressable onPress={() => safeGoBack('/(tabs)/orders')} className="mt-4">
          <Text className="font-bold text-primary">{t('goBack')}</Text>
        </ScaledPressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <BackHeader title={t('trackOrder')} />
      <ScrollView key={language} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-5 pt-2">
          <View className="self-start rounded-full bg-success/15 px-3 py-1">
            <Text className="text-[10px] font-bold text-success">{t('activeDelivery')}</Text>
          </View>
          <Text className="mt-3 text-2xl font-bold text-text">
            {t('orderDetails')}: {order.id}
          </Text>
        </View>

        <View className="mx-5 mt-4 flex-row items-center gap-3 rounded-card border border-border bg-trust p-4">
          <View className="h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
            <Ionicons name="bus-outline" size={22} color="#FEB623" />
          </View>
          <View>
            <Text className="text-base font-bold text-text">{order.quantitySummary}</Text>
            <Text className="text-sm text-text-secondary">{order.productGrade}</Text>
          </View>
        </View>

        <View className="mx-5 mt-5 rounded-card border border-border bg-surface p-4">
          <Text className="mb-4 text-[10px] font-bold tracking-widest text-text-secondary">
            {t('trackingTimeline')}
          </Text>
          {order.trackingTimeline.map((step, i) => (
            <View key={step.label} className="flex-row gap-3">
              <View className="items-center">
                {step.active ? (
                  <PulseDot size={20} />
                ) : (
                  <View
                    className={`h-4 w-4 rounded-full ${
                      step.done ? 'bg-primary' : 'border-2 border-border bg-surface'
                    }`}
                  />
                )}
                {i < order.trackingTimeline.length - 1 && (
                  <View className={`h-10 w-0.5 ${step.done ? 'bg-primary' : 'bg-border'}`} />
                )}
              </View>
              <View className="flex-1 flex-row items-center justify-between pb-4">
                <Text className={`text-sm font-bold ${step.active ? 'text-primary' : 'text-text'}`}>
                  {step.label}
                </Text>
                {step.active && step.time === 'LIVE' && (
                  <View className="rounded-full bg-success px-2 py-0.5">
                    <Text className="text-[9px] font-bold text-text-inverse">{t('live')}</Text>
                  </View>
                )}
                {!step.active && step.time ? (
                  <Text className="text-xs text-text-secondary">{step.time}</Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>

        <View className="mx-5 mt-2 overflow-hidden rounded-card" style={{ height: 200 }}>
          <MapView style={{ flex: 1 }} initialRegion={INITIAL_REGION}>
            <Marker coordinate={WAREHOUSE} title={t('warehouse')} pinColor="#1A73E8" />
            <Marker coordinate={DESTINATION} title={t('deliverySite')} pinColor="#FEB623" />
            <Marker coordinate={truckPos} title="Truck">
              <Ionicons name="bus" size={24} color="#FEB623" />
            </Marker>
            <Polyline
              coordinates={[WAREHOUSE, DESTINATION]}
              strokeColor="#FEB623"
              strokeWidth={3}
            />
          </MapView>
        </View>

        <View className="mx-5 mt-4 rounded-card border border-border bg-surface p-4">
          <View className="flex-row items-center gap-3">
            <Image source={{ uri: DRIVER_AVATAR }} style={{ width: 48, height: 48, borderRadius: 24 }} />
            <View className="flex-1">
              <Text className="text-base font-bold text-text">{order.driverName}</Text>
              <Text className="text-xs text-text-secondary">
                {t('vehicle')}: {order.vehicleNumber}
              </Text>
            </View>
          </View>
          <View className="mt-4 flex-row gap-3">
            <ScaledPressable
              onPress={() => Linking.openURL('tel:+919999999999')}
              className="flex-1 flex-row items-center justify-center rounded-lg bg-primary py-3">
              <Ionicons name="call" size={18} color="#FFF" />
              <Text className="ml-2 font-bold text-text-inverse">{t('callDriver')}</Text>
            </ScaledPressable>
            <ScaledPressable
              onPress={() => router.push('/support')}
              className="flex-1 items-center rounded-lg border border-border py-3">
              <Text className="font-semibold text-text-secondary">{t('support')}</Text>
            </ScaledPressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
