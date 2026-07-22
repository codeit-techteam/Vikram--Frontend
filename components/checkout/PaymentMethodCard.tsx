import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Ionicons as IoniconsType } from '@expo/vector-icons';

import { ScaledPressable } from '@components/ScaledPressable';

type PaymentMethodCardProps = {
  icon: keyof typeof IoniconsType.glyphMap;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
};

export function PaymentMethodCard({
  icon,
  title,
  subtitle,
  description,
  badge,
  selected = false,
  disabled = false,
  onPress,
}: PaymentMethodCardProps) {
  const isComingSoon = badge.toLowerCase().includes('coming soon');
  const badgeClassName = isComingSoon
    ? 'bg-warning/15'
    : 'bg-success/15';
  const badgeTextClassName = isComingSoon ? 'text-warning' : 'text-success';

  return (
    <ScaledPressable
      onPress={onPress}
      disabled={disabled}
      className={`mb-3 overflow-hidden rounded-card border-2 bg-surface shadow-sm ${
        selected ? 'border-primary bg-primary/5' : 'border-border'
      } ${disabled ? 'opacity-60' : ''}`}>
      <View className="p-4">
        <View className="flex-row items-start gap-3">
          <View
            className={`mt-0.5 h-5 w-5 items-center justify-center rounded-full border-2 ${
              selected ? 'border-primary bg-primary' : 'border-border bg-surface'
            }`}>
            {selected ? <View className="h-2 w-2 rounded-full bg-onPrimary" /> : null}
          </View>

          <View
            className={`h-11 w-11 items-center justify-center rounded-xl ${
              selected ? 'bg-primary/15' : 'bg-background'
            }`}>
            <Ionicons
              name={icon}
              size={22}
              color={selected ? '#FEB623' : '#666666'}
            />
          </View>

          <View className="min-h-[44px] flex-1">
            <View className="flex-row items-start justify-between gap-2">
              <Text
                className={`flex-1 text-base font-bold ${
                  selected ? 'text-primary' : 'text-text'
                }`}>
                {title}
              </Text>
              <View className={`rounded-full px-2.5 py-1 ${badgeClassName}`}>
                <Text className={`text-[10px] font-bold uppercase ${badgeTextClassName}`}>
                  {badge}
                </Text>
              </View>
            </View>
            <Text className="mt-1 text-xs text-text-secondary">{subtitle}</Text>
            <Text className="mt-2 text-xs leading-4 text-text-secondary">{description}</Text>
          </View>
        </View>
      </View>
    </ScaledPressable>
  );
}
