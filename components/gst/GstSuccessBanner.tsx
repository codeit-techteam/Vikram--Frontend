import { useEffect } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { theme, borderRadius } from '@constants/theme';
import { useTranslation } from '@store/languageStore';
import { formatINR } from '@utils/formatCurrency';

type GstSuccessBannerProps = {
  visible: boolean;
  onDismiss: () => void;
  autoHideMs?: number;
  discountPercent?: number;
  discountAmount?: number;
};

export function GstSuccessBanner({
  visible,
  onDismiss,
  autoHideMs = 4000,
  discountPercent = 18,
  discountAmount = 0,
}: GstSuccessBannerProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, autoHideMs);
    return () => clearTimeout(timer);
  }, [visible, autoHideMs, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(280)}
      exiting={FadeOut.duration(220)}
      style={{
        marginBottom: 12,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: `${theme.success}35`,
        backgroundColor: `${theme.success}10`,
        padding: 14,
        shadowColor: theme.success,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 3,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: theme.success,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: theme.textPrimary }}>
            {t('gstSuccessBannerTitle')}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2, lineHeight: 18 }}>
            {t('gstSuccessBannerSubtitle')}
          </Text>
          {discountAmount > 0 ? (
            <View
              style={{
                marginTop: 8,
                alignSelf: 'flex-start',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: `${theme.success}18`,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
              }}>
              <Ionicons name="pricetag" size={12} color={theme.success} />
              <Text style={{ fontSize: 11, fontWeight: '800', color: theme.success }}>
                {discountPercent}% {t('applied')} · -{formatINR(discountAmount)}
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 11, color: theme.success, fontWeight: '700', marginTop: 4 }}>
              {t('gstInvoiceEnabled')}
            </Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
