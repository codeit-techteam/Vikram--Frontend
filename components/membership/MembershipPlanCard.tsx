import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import {
  formatMembershipPrice,
  type MembershipPlanDefinition,
} from '@constants/membership';

interface MembershipPlanCardProps {
  plan: MembershipPlanDefinition;
  selected?: boolean;
  onJoin: (planId: MembershipPlanDefinition['id']) => void;
}

export function MembershipPlanCard({
  plan,
  selected = false,
  onJoin,
}: MembershipPlanCardProps) {
  const handleJoin = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoin(plan.id);
  };

  return (
    <View
      style={[
        styles.card,
        plan.popular && styles.cardPopular,
        selected && styles.cardSelected,
      ]}>
      {plan.popular ? (
        <View style={styles.popularBadge}>
          <Ionicons name="flame" size={12} color="#1A1A1A" />
          <Text style={styles.popularText}>Most Popular</Text>
        </View>
      ) : null}

      <Text style={styles.name}>{plan.name}</Text>
      <View style={styles.priceRow}>
        <Text style={styles.price}>{formatMembershipPrice(plan.annualPrice)}</Text>
        <Text style={styles.perYear}>/year</Text>
      </View>
      <Text style={styles.monthly}>
        ≈ {formatMembershipPrice(plan.monthlyPrice)}/month · Save {plan.savingsPercent}%
      </Text>

      <View style={styles.benefits}>
        {plan.benefits.map((benefit) => (
          <View key={benefit} style={styles.benefitRow}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={12} color="#1A1A1A" />
            </View>
            <Text style={styles.benefitText}>{benefit}</Text>
          </View>
        ))}
      </View>

      <ScaledPressable
        scaleTo={0.98}
        onPress={handleJoin}
        style={[styles.cta, plan.popular && styles.ctaPopular]}
        accessibilityRole="button"
        accessibilityLabel={`Join ${plan.name}`}>
        <Text style={[styles.ctaText, plan.popular && styles.ctaTextPopular]}>
          {selected ? 'Current Plan' : 'Join Now'}
        </Text>
      </ScaledPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
  },
  cardPopular: {
    borderColor: '#FEB623',
    borderWidth: 2,
    shadowColor: '#C8900A',
    shadowOpacity: 0.15,
  },
  cardSelected: {
    backgroundColor: '#FFFBEE',
  },
  popularBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEB623',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  popularText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 6,
    gap: 4,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  perYear: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  monthly: {
    marginTop: 4,
    fontSize: 12,
    color: '#999999',
  },
  benefits: {
    marginTop: 16,
    gap: 10,
    marginBottom: 18,
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
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  cta: {
    backgroundColor: '#1E1E1E',
    borderRadius: 28,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaPopular: {
    backgroundColor: '#FEB623',
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ctaTextPopular: {
    color: '#1A1A1A',
  },
});
