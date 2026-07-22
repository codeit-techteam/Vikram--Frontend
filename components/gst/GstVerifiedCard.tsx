import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ScaledPressable } from '@components/ScaledPressable';
import { VerifiedBadge } from '@components/gst/VerifiedBadge';
import { useTranslation } from '@store/languageStore';
import { borderRadius, theme } from '@constants/theme';
import { formatINR } from '@utils/formatCurrency';
import type { GstDetails } from '@/types/gst';

type GstVerifiedCardProps = {
  details: GstDetails;
  appliedTitle?: string;
  editLabel?: string;
  discountPercent?: number;
  discountAmount?: number;
  onPress: () => void;
};

export function GstVerifiedCard({
  details,
  appliedTitle = 'GST Invoice Applied',
  editLabel = 'Edit GST',
  discountPercent = 18,
  discountAmount = 0,
  onPress,
}: GstVerifiedCardProps) {
  const { t } = useTranslation();
  const hasDiscount = discountAmount > 0;

  return (
    <ScaledPressable onPress={onPress} style={{ width: '100%' }}>
      <Animated.View
        entering={FadeInDown.duration(300).springify().damping(18)}
        style={{
          marginBottom: 12,
          borderRadius: borderRadius.lg,
          borderWidth: 1,
          borderColor: `${theme.success}30`,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        }}>
        <LinearGradient
          colors={['#F0FDF4', '#FFFFFF', '#F7FEF9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 16 }}>
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: theme.success,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
              }}>
              <Ionicons name="shield-checkmark" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.textPrimary }}>
                  {appliedTitle}
                </Text>
                <VerifiedBadge variant="verified" compact />
              </View>
              {hasDiscount ? (
                <Animated.View entering={FadeInRight.duration(250).delay(80)} style={{ marginTop: 4 }}>
                  <View
                    style={{
                      alignSelf: 'flex-start',
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: `${theme.success}18`,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 999,
                    }}>
                    <Ionicons name="pricetag" size={11} color={theme.success} />
                    <Text style={{ fontSize: 11, fontWeight: '800', color: theme.success }}>
                      {discountPercent}% {t('applied')} · {t('save')} {formatINR(discountAmount)}
                    </Text>
                  </View>
                </Animated.View>
              ) : null}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: theme.primary }}>{editLabel}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.primary} style={{ marginTop: 2 }} />
            </View>
          </View>

          {/* GSTIN block */}
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.85)',
              borderRadius: borderRadius.md,
              borderWidth: 1,
              borderColor: `${theme.success}20`,
              padding: 12,
            }}>
            <Text
              style={{
                fontSize: 9,
                fontWeight: '700',
                color: theme.textMuted,
                letterSpacing: 1,
                marginBottom: 4,
              }}>
              GSTIN
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: '800',
                color: theme.textPrimary,
                letterSpacing: 1,
                fontVariant: ['tabular-nums'],
              }}>
              {details.gstNumber}
            </Text>

            <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }} />

            <Text style={{ fontSize: 13, fontWeight: '600', color: theme.textPrimary }} numberOfLines={2}>
              {details.businessName}
            </Text>
            {details.state ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <Ionicons name="location-outline" size={12} color={theme.textMuted} />
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>{details.state}</Text>
              </View>
            ) : null}
          </View>

          {/* Footer chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: `${theme.success}12`,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
              }}>
              <Ionicons name="receipt-outline" size={12} color={theme.success} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.success }}>
                {t('businessInvoiceEnabled')}
              </Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: `${theme.primary}15`,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 999,
              }}>
              <Ionicons name="briefcase-outline" size={12} color={theme.primary} />
              <Text style={{ fontSize: 10, fontWeight: '700', color: theme.textPrimary }}>
                {t('businessPurchase')}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </ScaledPressable>
  );
}
