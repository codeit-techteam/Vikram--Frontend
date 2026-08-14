import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useTranslation } from '@store/languageStore';

interface DeliveryOptionsProps {
  siteName: string;
  deliveryMessage?: string;
}

export function DeliveryOptions({
  siteName,
  deliveryMessage,
}: DeliveryOptionsProps) {
  const { t } = useTranslation();
  const etaLabel = deliveryMessage || 'Select delivery location to calculate ETA';

  return (
    <View className="mx-5 mt-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-text">{t('deliveryLogistics')}</Text>
        <View className="flex-row items-center gap-1 rounded-full bg-success/15 px-2.5 py-1">
          <View className="h-1.5 w-1.5 rounded-full bg-success" />
          <Text className="text-[10px] font-bold text-success">{t('availableNow')}</Text>
        </View>
      </View>

      <View className="mt-3 rounded-card border border-border bg-trust p-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="flash-outline" size={18} color="#FEB623" />
          <Text className="text-sm font-bold text-text">Estimated Delivery</Text>
        </View>
        <Text className="mt-2 text-lg font-extrabold text-primary">{etaLabel}</Text>
        <Text className="mt-1 text-xs text-text-secondary">
          Delivering to {siteName}
        </Text>
      </View>

      <View className="mt-4 rounded-card border border-border bg-trust p-4">
        <Text className="text-[10px] font-bold tracking-widest text-text-secondary">
          {t('logisticsBreakdown')}
        </Text>
        <View className="mt-3 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-text-secondary">Delivery estimate</Text>
            <Text className="text-sm font-semibold text-text">{etaLabel}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-text-secondary">{t('distance')}</Text>
            <Text className="text-sm font-bold text-success">INCLUDED</Text>
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-2 rounded-card bg-primary px-4 py-3">
        <Ionicons name="flash" size={16} color="#FFFFFF" />
        <Text className="flex-1 text-xs font-medium text-onPrimary">
          {t('fastestDelivery')} {siteName}. {etaLabel}.
        </Text>
      </View>
    </View>
  );
}
