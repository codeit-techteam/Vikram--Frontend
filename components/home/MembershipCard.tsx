import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { useTranslation } from '@store/languageStore';

const BENEFIT_KEYS = [
  'membershipExtraDiscount',
  'membershipFreeDelivery',
  'membershipBulkDiscounts',
  'membershipInternationalTrips',
  'membershipLuckyDraw',
  'membershipLoyaltyPoints',
] as const;

interface MembershipCardProps {
  onJoin?: () => void;
}

export function MembershipCard({ onJoin }: MembershipCardProps) {
  const { t } = useTranslation();

  const handleJoin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoin?.();
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="diamond-outline" size={14} color="#1A1A1A" />
          <Text style={styles.badgeText}>{t('membershipBadge')}</Text>
        </View>
        <Text style={styles.price}>
          ₹299
          <Text style={styles.priceUnit}>/{t('membershipPerYear')}</Text>
        </Text>
      </View>

      <Text style={styles.title}>{t('membershipTitle')}</Text>
      <Text style={styles.subtitle}>{t('membershipSubtitle')}</Text>

      <View style={styles.benefits}>
        {BENEFIT_KEYS.map((key) => (
          <View key={key} style={styles.benefitRow}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={12} color="#1A1A1A" />
            </View>
            <Text style={styles.benefitText}>{t(key)}</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={handleJoin} style={styles.cta} accessibilityRole="button">
        <Text style={styles.ctaText}>{t('joinNow')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0E6C8',
    shadowColor: '#C8900A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF4D1',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.3,
  },
  price: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  priceUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  benefits: {
    marginTop: 14,
    gap: 8,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEB623',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  cta: {
    marginTop: 16,
    backgroundColor: '#FEB623',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#C8900A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});
