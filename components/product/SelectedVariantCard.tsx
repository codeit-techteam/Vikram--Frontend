import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { formatINR } from '@utils/formatCurrency';

interface SelectedVariantCardProps {
  variantLabel: string;
  unit: string;
  price: number;
}

export function SelectedVariantCard({ variantLabel, unit, price }: SelectedVariantCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.duration(280).springify().damping(18)}
      className="mt-3 rounded-card border border-primary/30 bg-primary/10 p-4">
      <View className="mb-2 flex-row items-center gap-2">
        <Ionicons name="checkmark-circle" size={18} color="#FEB623" />
        <Text className="text-xs font-bold uppercase tracking-wider text-primary">
          Selected Variant
        </Text>
      </View>
      <Text className="text-lg font-bold text-text">{variantLabel}</Text>
      <View className="mt-2 flex-row flex-wrap gap-x-4 gap-y-1">
        <Text className="text-sm text-text-secondary">
          Unit: <Text className="font-semibold text-text">{unit}</Text>
        </Text>
        <Text className="text-sm text-text-secondary">
          Price: <Text className="font-bold text-primary">{formatINR(price)}</Text>
        </Text>
      </View>
    </Animated.View>
  );
}
