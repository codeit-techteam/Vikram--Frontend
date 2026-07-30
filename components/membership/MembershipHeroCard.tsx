import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ScaledPressable } from '@components/ScaledPressable';
import {
  MEMBERSHIP_BRAND,
  formatMembershipPrice,
  type MembershipPlanDefinition,
} from '@constants/membership';

interface MembershipHeroCardProps {
  plan: MembershipPlanDefinition;
  onJoin: () => void;
  isActive?: boolean;
}

export function MembershipHeroCard({
  plan,
  onJoin,
  isActive = false,
}: MembershipHeroCardProps) {
  const handleJoin = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onJoin();
  };

  return (
    <View style={styles.card}>
      <View style={styles.badgeRow}>
        <View style={styles.goldBadge}>
          <MaterialCommunityIcons name="crown" size={14} color="#1A1A1A" />
          <Text style={styles.goldBadgeText}>PREMIUM</Text>
        </View>
        {plan.popular ? (
          <View style={styles.popularChip}>
            <Text style={styles.popularChipText}>Most Popular</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.brand}>{MEMBERSHIP_BRAND.name}</Text>
      <Text style={styles.planName}>{plan.name}</Text>

      <View style={styles.priceBlock}>
        <Text style={styles.annual}>
          {formatMembershipPrice(plan.annualPrice)}
          <Text style={styles.annualSuffix}>/year</Text>
        </Text>
        <Text style={styles.monthly}>
          {formatMembershipPrice(plan.monthlyPrice)}/month · Save {plan.savingsPercent}%
        </Text>
      </View>

      <ScaledPressable
        scaleTo={0.98}
        onPress={handleJoin}
        style={styles.cta}
        accessibilityRole="button">
        <Text style={styles.ctaText}>{isActive ? 'Manage Plan' : 'Join Now'}</Text>
        <Ionicons name="arrow-forward" size={18} color="#1A1A1A" />
      </ScaledPressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3A3200',
    shadowColor: '#C8900A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  goldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEB623',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  goldBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.6,
  },
  popularChip: {
    backgroundColor: 'rgba(254,182,35,0.2)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  popularChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FEB623',
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FEB623',
    letterSpacing: 1,
    marginBottom: 4,
  },
  planName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  priceBlock: {
    marginTop: 14,
    marginBottom: 18,
  },
  annual: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  annualSuffix: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
  },
  monthly: {
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  cta: {
    backgroundColor: '#FEB623',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
  },
});
