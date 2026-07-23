import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import type { CmsPromotion } from '@/types/cms';

interface MembershipCardProps {
  onJoin?: () => void;
  promotion?: CmsPromotion | null;
}

export function MembershipCard({ onJoin, promotion }: MembershipCardProps) {
  const handleJoin = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoin?.();
  };

  const badge = promotion?.badge ?? 'MEMBERSHIP';
  const priceLabel = promotion?.description ?? '₹299';
  const title = promotion?.title ?? 'Bajriwala Membership';
  const subtitle =
    promotion?.subtitle ?? 'Unlock premium savings and perks for your sites.';
  const benefits = promotion?.benefits?.length
    ? promotion.benefits
    : [
        'Extra Discount',
        'Free Delivery',
        'Bulk Discounts',
        'International Trips',
        'Lucky Draw',
        'Loyalty Points',
      ];
  const buttonText = promotion?.buttonText ?? 'Join Now';

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.badge}>
          <Ionicons name="diamond-outline" size={14} color="#1A1A1A" />
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
        <Text style={styles.price}>{priceLabel}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>

      <View style={styles.benefits}>
        {benefits.map((label) => (
          <View key={label} style={styles.benefitRow}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={12} color="#1A1A1A" />
            </View>
            <Text style={styles.benefitText}>{label}</Text>
          </View>
        ))}
      </View>

      <Pressable onPress={handleJoin} style={styles.cta} accessibilityRole="button">
        <Text style={styles.ctaText}>{buttonText}</Text>
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
    backgroundColor: '#FEB623',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  price: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
    marginBottom: 14,
  },
  benefits: {
    gap: 10,
    marginBottom: 16,
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
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  cta: {
    backgroundColor: '#FEB623',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});
