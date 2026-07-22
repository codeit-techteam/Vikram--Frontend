import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { useTranslation } from '@store/languageStore';
import { theme, borderRadius } from '@constants/theme';

const BENEFIT_KEYS = [
  'gstBenefitInvoice',
  'gstBenefitAccounting',
  'gstBenefitHistory',
  'gstBenefitItc',
] as const;

export function BusinessBenefits() {
  const { t } = useTranslation();

  return (
    <Animated.View
      entering={FadeInDown.duration(280).delay(80)}
      style={{
        marginBottom: 12,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: theme.bgMain,
        padding: 14,
      }}>
      <Text
        style={{
          fontSize: 11,
          fontWeight: '800',
          color: theme.textMuted,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          marginBottom: 10,
        }}>
        {t('businessBenefits')}
      </Text>
      {BENEFIT_KEYS.map((key) => (
        <View
          key={key}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 8,
            marginBottom: key === 'gstBenefitItc' ? 0 : 8,
          }}>
          <Ionicons name="checkmark-circle" size={15} color={theme.success} style={{ marginTop: 1 }} />
          <Text
            style={{
              flex: 1,
              fontSize: 12,
              color: key === 'gstBenefitItc' ? theme.textMuted : theme.textSecondary,
              lineHeight: 17,
            }}>
            {t(key)}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}
