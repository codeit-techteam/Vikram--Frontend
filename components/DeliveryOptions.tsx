import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import { formatINR } from '@utils/formatCurrency';

export type DeliveryType = 'priority' | 'standard' | 'scheduled';

interface DeliveryOptionsProps {
  selected: DeliveryType;
  onSelect: (type: DeliveryType) => void;
  siteName: string;
}

function DeliveryCard({
  type,
  title,
  time,
  price,
  priceColor,
  selected,
  onSelect,
}: {
  type: DeliveryType;
  title: string;
  time: string;
  price: string;
  priceColor: string;
  selected: boolean;
  onSelect: (type: DeliveryType) => void;
}) {
  const animStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(selected ? '#FF6B00' : '#E0E0E0', { duration: 200 }),
    backgroundColor: withTiming(selected ? '#FFF8F3' : '#FFFFFF', { duration: 200 }),
  }));

  return (
    <Animated.View style={[{ flex: 1, borderRadius: 12, borderWidth: 2 }, animStyle]}>
      <ScaledPressable onPress={() => onSelect(type)} className="items-center p-3">
        <Text className={`text-sm font-bold ${selected ? 'text-primary' : 'text-text'}`}>
          {title}
        </Text>
        <Text className="mt-1 text-xs text-text-secondary">{time}</Text>
        <Text className="mt-1 text-xs font-bold" style={{ color: priceColor }}>
          {price}
        </Text>
      </ScaledPressable>
    </Animated.View>
  );
}

export function DeliveryOptions({ selected, onSelect, siteName }: DeliveryOptionsProps) {
  return (
    <View className="mx-5 mt-6">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-bold text-text">Delivery & Logistics</Text>
        <View className="flex-row items-center gap-1 rounded-full bg-success/15 px-2.5 py-1">
          <View className="h-1.5 w-1.5 rounded-full bg-success" />
          <Text className="text-[10px] font-bold text-success">Available Now</Text>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        <Ionicons name="time-outline" size={16} color="#FF6B00" />
        <Text className="text-sm font-bold text-text">Delivery in 2–4 Hours</Text>
      </View>
      <Text className="mt-1 text-xs text-text-secondary">
        Nearest warehouse: 4.2 km (Thane West)
      </Text>

      <View className="mt-4 flex-row gap-2">
        <DeliveryCard
          type="priority"
          title="Priority"
          time="2–4 Hours"
          price={formatINR(250, false)}
          priceColor="#FF6B00"
          selected={selected === 'priority'}
          onSelect={onSelect}
        />
        <DeliveryCard
          type="standard"
          title="Standard"
          time="6–8 Hours"
          price="FREE"
          priceColor="#2E7D32"
          selected={selected === 'standard'}
          onSelect={onSelect}
        />
        <DeliveryCard
          type="scheduled"
          title="Scheduled"
          time="Choose slot"
          price="Site-ready"
          priceColor="#666666"
          selected={selected === 'scheduled'}
          onSelect={onSelect}
        />
      </View>

      <View className="mt-4 rounded-card border border-border bg-trust p-4">
        <Text className="text-[10px] font-bold tracking-widest text-text-secondary">
          LOGISTICS BREAKDOWN
        </Text>
        <View className="mt-3 gap-2">
          <View className="flex-row justify-between">
            <Text className="text-sm text-text-secondary">Heavy Load</Text>
            <Text className="text-sm font-semibold text-text">{formatINR(400, false)}</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-text-secondary">Distance (4.2km)</Text>
            <Text className="text-sm font-bold text-success">INCLUDED</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-sm text-text-secondary">Unloading Help</Text>
            <Text className="text-sm font-semibold text-text">{formatINR(150, false)}</Text>
          </View>
        </View>
      </View>

      <View className="mt-4 flex-row items-center gap-2 rounded-card bg-primary px-4 py-3">
        <Ionicons name="flash" size={16} color="#FFFFFF" />
        <Text className="flex-1 text-xs font-medium text-text-inverse">
          Fastest delivery to {siteName}. Materials available at Thane West warehouse.
        </Text>
      </View>

      <View className="mt-4 flex-row justify-between">
        {[
          { icon: 'bus-outline' as const, label: '10-TON TIPPER\nACCESSIBLE' },
          { icon: 'people-outline' as const, label: 'UNLOADING HELP\nAVAILABLE' },
          { icon: 'cube-outline' as const, label: 'HEAVY MATERIALS\nHANDLED' },
        ].map((f) => (
          <View key={f.label} className="flex-1 items-center">
            <Ionicons name={f.icon} size={20} color="#666666" />
            <Text className="mt-1 text-center text-[8px] font-semibold text-text-secondary">
              {f.label}
            </Text>
          </View>
        ))}
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-card border border-border bg-surface p-3">
          <Text className="text-[10px] font-bold text-text-secondary">WAREHOUSE</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <Ionicons name="home-outline" size={18} color="#FF6B00" />
            <Text className="text-sm font-bold text-text">Thane West</Text>
          </View>
        </View>
        <View className="flex-1 rounded-card border border-border bg-surface p-3">
          <Text className="text-[10px] font-bold text-text-secondary">VEHICLE</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <Ionicons name="bus-outline" size={18} color="#FF6B00" />
            <Text className="text-sm font-bold text-text">10-Ton Tipper</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
