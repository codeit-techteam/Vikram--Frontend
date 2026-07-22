import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ScaledPressable } from '@components/ScaledPressable';
import { borderRadius, theme } from '@constants/theme';

type GstInvoiceCardProps = {
  title?: string;
  subtitle?: string;
  onPress: () => void;
};

/** Shown when GST is NOT_ADDED — tap to open bottom sheet */
export function GstInvoiceCard({
  title = 'GST Invoice',
  subtitle = 'Add GST details to receive GST Invoice for Business Purchases',
  onPress,
}: GstInvoiceCardProps) {
  return (
    <ScaledPressable onPress={onPress} style={{ width: '100%' }}>
      <Animated.View
        entering={FadeIn.duration(250)}
        style={{
          marginBottom: 12,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.white,
          padding: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: theme.primaryUltraLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="receipt-outline" size={24} color={theme.primary} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '800',
                color: theme.textPrimary,
                marginBottom: 4,
              }}>
              {title}
            </Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, lineHeight: 18 }}>
              {subtitle}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={theme.mediumGray} />
        </View>
      </Animated.View>
    </ScaledPressable>
  );
}
